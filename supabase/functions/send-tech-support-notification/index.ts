import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TicketData {
  id?: string;
  company_name: string;
  problem_description: string;
  action_needed: string;
  created_by_name: string;
  created_at?: string;
}

interface NotificationRequest {
  ticketData: TicketData;
  emails: string[];
}

interface TicketAttachment {
  id: string;
  path: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  width?: number;
  height?: number;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Received request:", req.method);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("Handling CORS preflight request");
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    console.error("Method not allowed:", req.method);
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    console.log("Processing POST request");
    
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!resendApiKey) {
      console.error("RESEND_API_KEY environment variable not set");
      return new Response(JSON.stringify({ error: "Email service not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Supabase configuration missing");
      return new Response(JSON.stringify({ error: "Database service not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(resendApiKey);
    console.log("Services initialized");

    const requestBody = await req.json();
    console.log("Request body parsed:", JSON.stringify(requestBody, null, 2));
    
    const { ticketData, emails }: NotificationRequest = requestBody;

    if (!ticketData || !emails || !Array.isArray(emails)) {
      console.error("Invalid request body structure");
      return new Response(JSON.stringify({ error: "Invalid request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log(`Preparing to send emails to ${emails.length} recipients`);

    // Fetch attachments for this ticket
    let attachments: TicketAttachment[] = [];
    let attachmentHtml = '';
    
    if (ticketData.id) {
      console.log(`Fetching attachments for ticket ${ticketData.id}`);
      
      const { data: attachmentData, error: attachmentError } = await supabase
        .from('ticket_attachments')
        .select('*')
        .eq('ticket_id', ticketData.id);

      if (attachmentError) {
        console.error('Error fetching attachments:', attachmentError);
      } else {
        attachments = attachmentData || [];
        console.log(`Found ${attachments.length} attachments`);

        if (attachments.length > 0) {
          // Generate signed URLs for attachments (7 days expiry)
          const attachmentPromises = attachments.map(async (attachment) => {
            const { data: signedUrlData } = await supabase.storage
              .from('ticket-attachments')
              .createSignedUrl(attachment.path, 60 * 60 * 24 * 7); // 7 days

            return {
              ...attachment,
              signedUrl: signedUrlData?.signedUrl
            };
          });

          const attachmentsWithUrls = await Promise.all(attachmentPromises);
          console.log('Generated signed URLs for attachments');

          // Create attachment HTML
          attachmentHtml = `
            <div style="background-color: white; padding: 25px; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 25px;">
              <h3 style="color: #1f2937; margin-top: 0; margin-bottom: 20px; font-size: 18px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; display: flex; align-items: center;">
                <span style="margin-right: 8px;">📎</span> Attachments (${attachments.length})
              </h3>
              <div style="space-y: 15px;">
                ${attachmentsWithUrls.map(att => {
                  if (att.mime_type.startsWith('image/') && att.signedUrl) {
                    return `
                      <div style="margin-bottom: 15px; padding: 15px; background-color: #f9fafb; border-radius: 6px; border: 1px solid #e5e7eb;">
                        <a href="${att.signedUrl}" target="_blank" style="text-decoration: none;">
                          <img src="${att.signedUrl}" alt="${att.original_name}" style="max-width: 300px; max-height: 200px; border-radius: 4px; border: 1px solid #ddd; display: block; margin-bottom: 8px;">
                        </a>
                        <p style="margin: 0; font-size: 14px; color: #374151;">
                          <a href="${att.signedUrl}" target="_blank" style="color: #2563eb; text-decoration: none; font-weight: 500;">📷 ${att.original_name}</a>
                          <span style="color: #6b7280;"> (${Math.round(att.size_bytes / 1024)}KB)</span>
                        </p>
                      </div>
                    `;
                  } else if (att.signedUrl) {
                    return `
                      <div style="margin-bottom: 15px; padding: 15px; background-color: #f9fafb; border-radius: 6px; border: 1px solid #e5e7eb;">
                        <p style="margin: 0; font-size: 14px; color: #374151;">
                          <a href="${att.signedUrl}" target="_blank" style="color: #2563eb; text-decoration: none; font-weight: 500;">
                            📄 ${att.original_name}
                          </a>
                          <span style="color: #6b7280;"> (${Math.round(att.size_bytes / 1024)}KB)</span>
                        </p>
                      </div>
                    `;
                  }
                  return `<div style="margin-bottom: 15px; padding: 15px; background-color: #fefefe; border-radius: 6px;"><p style="margin: 0; font-size: 14px; color: #6b7280;">❌ ${att.original_name} (unavailable)</p></div>`;
                }).join('')}
              </div>
            </div>
          `;
        }
      }
    }

    // Create HTML email content
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>New Tech Support Ticket</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .content { background-color: #ffffff; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px; }
          .field { margin-bottom: 15px; }
          .field-label { font-weight: bold; color: #495057; }
          .field-value { margin-top: 5px; padding: 10px; background-color: #f8f9fa; border-radius: 4px; }
          .footer { margin-top: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 8px; text-align: center; font-size: 14px; color: #6c757d; }
          a { color: #007bff; text-decoration: none; }
          a:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎫 New Tech Support Ticket</h1>
            <p>A new tech support ticket has been created and requires attention.</p>
          </div>
          
          <div class="content">
            <div class="field">
              <div class="field-label">🏢 Company Name:</div>
              <div class="field-value">${ticketData.company_name}</div>
            </div>
            
            <div class="field">
              <div class="field-label">🐛 Problem Description:</div>
              <div class="field-value">${ticketData.problem_description}</div>
            </div>
            
            <div class="field">
              <div class="field-label">🛠️ Action Needed:</div>
              <div class="field-value">${ticketData.action_needed}</div>
            </div>
            
            <div class="field">
              <div class="field-label">👤 Created by:</div>
              <div class="field-value">${ticketData.created_by_name}</div>
            </div>
            
            <div class="field">
              <div class="field-label">📅 Created at:</div>
              <div class="field-value">${ticketData.created_at ? new Date(ticketData.created_at).toLocaleString() : 'Just now'}</div>
            </div>
          </div>
          
          ${attachmentHtml}
          
          <div class="footer">
            <p>This is an automated notification from the Tech Support System.</p>
            <p>Please respond to this ticket as soon as possible.</p>
            ${ticketData.id ? `<p><strong>Ticket ID:</strong> ${ticketData.id}</p>` : ''}
          </div>
        </div>
      </body>
      </html>
    `;

    const results = [];
    console.log("Starting to send emails...");

    // Send email to each recipient
    for (let i = 0; i < emails.length; i++) {
      const email = emails[i];
      console.log(`Sending email ${i + 1}/${emails.length} to: ${email}`);
      
      try {
        const emailResponse = await resend.emails.send({
          from: "Tech Support <noreply@resend.dev>",
          to: [email],
          subject: `🎫 New Tech Support Ticket: ${ticketData.company_name}`,
          html: emailHtml,
        });

        console.log(`Email sent successfully to ${email}:`, emailResponse);
        results.push({ email, success: true, id: emailResponse.data?.id });
        
        // Add a small delay between emails to avoid rate limiting
        if (i < emails.length - 1) {
          console.log("Waiting 100ms before sending next email...");
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (emailError) {
        console.error(`Failed to send email to ${email}:`, emailError);
        results.push({ email, success: false, error: emailError.message });
      }
    }

    console.log("All emails processed. Results:", results);
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    
    console.log(`Email sending completed: ${successCount} successful, ${failureCount} failed`);

    return new Response(JSON.stringify({ 
      success: true, 
      results,
      summary: {
        total: emails.length,
        successful: successCount,
        failed: failureCount
      }
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error in send-tech-support-notification function:", error);
    console.error("Error stack:", error.stack);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: "An error occurred while processing the notification request"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);