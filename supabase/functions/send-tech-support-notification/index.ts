import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TicketAttachment {
  id: string;
  path: string;
  mime_type: string;
  size_bytes: number;
  original_name: string;
  signedUrl?: string;
}

interface TechSupportTicketData {
  id: string;
  company_name: string;
  problem_description: string;
  action_needed: string;
  status: string;
  attachment_url?: string;  // Legacy field - keep for compatibility
  attachment_name?: string; // Legacy field - keep for compatibility
  created_by_name: string;
  created_at: string;
  attachments?: TicketAttachment[]; // New field for multiple attachments
}

interface TechSupportNotificationRequest {
  ticketData: TechSupportTicketData;
  emails: string[];
}

const handler = async (req: Request): Promise<Response> => {
  console.log(`Received ${req.method} request to send-tech-support-notification`);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("Handling CORS preflight request");
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow POST requests for the actual functionality
  if (req.method !== "POST") {
    console.log(`Method ${req.method} not allowed`);
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { 
        status: 405, 
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );
  }

  try {
    // Check if RESEND_API_KEY is configured
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    console.log('RESEND_API_KEY exists:', !!resendApiKey);
    
    if (!resendApiKey) {
      console.error("RESEND_API_KEY environment variable is not set");
      return new Response(
        JSON.stringify({ error: "Email service not configured - RESEND_API_KEY missing" }),
        { 
          status: 500, 
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }

    // Initialize Resend with the API key
    const resend = new Resend(resendApiKey);

    // Parse request body
    let requestBody;
    try {
      const bodyText = await req.text();
      console.log('Raw request body received, length:', bodyText.length);
      
      if (!bodyText.trim()) {
        throw new Error('Empty request body');
      }
      
      requestBody = JSON.parse(bodyText);
      console.log('Successfully parsed request body');
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body or empty body' }),
        { 
          status: 400, 
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }

    const { ticketData, emails } = requestBody;
    
    console.log('Processing tech support notification request:', {
      hasTicketData: !!ticketData,
      companyName: ticketData?.company_name,
      emailCount: emails?.length || 0,
    });

    if (!ticketData || !emails || emails.length === 0) {
      console.error('Missing required data for tech support notification');
      return new Response(
        JSON.stringify({ error: 'Missing ticket data or email addresses' }),
        { 
          status: 400, 
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }

    // Helper functions
    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('de-DE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const emailSubject = `🔧 Tech Support Ticket - ${ticketData.company_name}`;
    
    const emailHtml = `
      <!DOCTYPE html>
      <html lang="de">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Tech Support Ticket</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <!-- Header -->
        <div style="background-color: #dc2626; color: white; padding: 30px; border-radius: 8px; margin-bottom: 30px; text-align: center;">
          <h1 style="margin: 0 0 10px 0; font-size: 28px; font-weight: bold;">🔧 ABMedia Team</h1>
          <h2 style="margin: 0; font-size: 22px; font-weight: normal;">Neues Tech Support Ticket</h2>
        </div>

        <!-- Ticket Header with Company Name and Status -->
        <div style="background-color: white; padding: 25px; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 25px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <h2 style="margin: 0; font-size: 24px; color: #1f2937;">${ticketData.company_name}</h2>
            <div style="display: flex; gap: 10px;">
              <span style="padding: 6px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; background-color: #fef3c7; color: #92400e;">
                TECH SUPPORT
              </span>
              <span style="padding: 6px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; background-color: #dbeafe; color: #1e40af;">
                ${ticketData.status || 'In Progress'}
              </span>
            </div>
          </div>
        </div>

        <!-- Two Column Layout -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 25px; margin-bottom: 25px;">
          
          <!-- Ticket Information Column -->
          <div style="background-color: white; padding: 25px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <h3 style="color: #1f2937; margin-top: 0; margin-bottom: 20px; font-size: 18px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; display: flex; align-items: center;">
              <span style="margin-right: 8px;">🎫</span> Ticket Information
            </h3>
            
            <div style="space-y: 15px;">
              <div style="margin-bottom: 15px;">
                <strong style="color: #374151; display: block; margin-bottom: 5px;">Company:</strong>
                <span style="color: #1f2937;">${ticketData.company_name}</span>
              </div>
              
              <div style="margin-bottom: 15px;">
                <strong style="color: #374151; display: block; margin-bottom: 5px;">👤 Created By:</strong>
                <span style="color: #1f2937;">${ticketData.created_by_name}</span>
              </div>
              
              <div style="margin-bottom: 15px;">
                <strong style="color: #374151; display: block; margin-bottom: 5px;">📅 Created:</strong>
                <span style="color: #1f2937;">${formatDate(ticketData.created_at || new Date().toISOString())}</span>
              </div>
              
              <div style="margin-bottom: 0;">
                <strong style="color: #374151; display: block; margin-bottom: 5px;">📊 Status:</strong>
                <span style="padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; background-color: #dbeafe; color: #1e40af;">
                  ${ticketData.status || 'In Progress'}
                </span>
              </div>
            </div>
          </div>

          <!-- Quick Actions Column -->
          <div style="background-color: white; padding: 25px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <h3 style="color: #1f2937; margin-top: 0; margin-bottom: 20px; font-size: 18px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; display: flex; align-items: center;">
              <span style="margin-right: 8px;">⚡</span> Quick Actions
            </h3>
            
            <div style="space-y: 15px;">
              <div style="margin-bottom: 15px;">
                <strong style="color: #374151; display: block; margin-bottom: 5px;">🔗 Dashboard Link:</strong>
                <a href="https://ab4babd7-978c-4acd-b78b-5f6332997961.lovableproject.com/tech-support" style="color: #2563eb; text-decoration: none; font-weight: 500;" target="_blank">View in Dashboard</a>
              </div>
              
              <div style="margin-bottom: 15px;">
                <strong style="color: #374151; display: block; margin-bottom: 5px;">📧 Reply To:</strong>
                <a href="mailto:tech-support@abmedia-team.com" style="color: #2563eb; text-decoration: none;">tech-support@abmedia-team.com</a>
              </div>
            </div>
          </div>
        </div>

        <!-- Problem Description Section -->
        <div style="background-color: white; padding: 25px; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 25px;">
          <h3 style="color: #1f2937; margin-top: 0; margin-bottom: 20px; font-size: 18px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; display: flex; align-items: center;">
            <span style="margin-right: 8px;">🐛</span> Problem Description
          </h3>
          <div style="background-color: #fef2f2; padding: 15px; border-radius: 6px; border-left: 4px solid #dc2626;">
            <p style="margin: 0; white-space: pre-wrap; color: #374151; line-height: 1.6;">${ticketData.problem_description}</p>
          </div>
        </div>

        <!-- Action Needed Section -->
        <div style="background-color: white; padding: 25px; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 25px;">
          <h3 style="color: #1f2937; margin-top: 0; margin-bottom: 20px; font-size: 18px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; display: flex; align-items: center;">
            <span style="margin-right: 8px;">🔧</span> Action Needed
          </h3>
          <div style="background-color: #f0f9ff; padding: 15px; border-radius: 6px; border-left: 4px solid #2563eb;">
            <p style="margin: 0; white-space: pre-wrap; color: #374151; line-height: 1.6;">${ticketData.action_needed}</p>
          </div>
        </div>

        ${ticketData.attachments && ticketData.attachments.length > 0 ? `
        <!-- Attachments Section -->
        <div style="background-color: white; padding: 25px; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 25px;">
          <h3 style="color: #1f2937; margin-top: 0; margin-bottom: 20px; font-size: 18px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; display: flex; align-items: center;">
            <span style="margin-right: 8px;">📎</span> Attachments (${ticketData.attachments.length})
          </h3>
          <div style="display: grid; gap: 15px;">
            ${ticketData.attachments.map(attachment => `
              <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; border: 1px solid #e5e7eb; display: flex; align-items: center; gap: 15px;">
                ${attachment.mime_type?.startsWith('image/') ? 
                  `<div style="flex-shrink: 0;">
                    <img src="${attachment.signedUrl}" alt="${attachment.original_name}" style="width: 120px; height: 120px; object-fit: cover; border-radius: 4px; border: 1px solid #d1d5db;">
                   </div>` : 
                  `<div style="flex-shrink: 0; width: 40px; height: 40px; background-color: #e5e7eb; border-radius: 4px; display: flex; align-items: center; justify-content: center;">
                    📄
                   </div>`
                }
                <div style="flex: 1;">
                  <div style="font-weight: 600; color: #1f2937; margin-bottom: 4px;">${attachment.original_name}</div>
                  <div style="font-size: 14px; color: #6b7280; margin-bottom: 8px;">
                    ${attachment.mime_type} • ${Math.round(attachment.size_bytes / 1024)}KB
                  </div>
                  <a href="${attachment.signedUrl}" target="_blank" style="color: #2563eb; text-decoration: none; font-weight: 500; font-size: 14px;">
                    ${attachment.mime_type?.startsWith('image/') ? '🖼️ View Image' : '📥 Download File'}
                  </a>
                </div>
              </div>
            `).join('')}
          </div>
        </div>` : ''}

        ${ticketData.attachment_url ? `
        <!-- Legacy Attachment Section (for backwards compatibility) -->
        <div style="background-color: white; padding: 25px; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 25px;">
          <h3 style="color: #1f2937; margin-top: 0; margin-bottom: 20px; font-size: 18px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; display: flex; align-items: center;">
            <span style="margin-right: 8px;">📎</span> Attachment
          </h3>
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; border: 1px solid #e5e7eb;">
            <a href="${ticketData.attachment_url}" target="_blank" style="color: #2563eb; text-decoration: none; font-weight: 500;">
              📄 ${ticketData.attachment_name || 'View Attachment'}
            </a>
          </div>
        </div>` : ''}

        <!-- Footer -->
        <div style="background-color: #f8f9fa; padding: 25px; border-radius: 8px; margin-top: 30px; text-align: center; border: 1px solid #e5e7eb;">
          <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
            Diese E-Mail wurde automatisch vom ABMedia Tech Support System generiert.
          </p>
          <p style="margin: 0; color: #6b7280; font-size: 14px;">
            Für weitere Informationen besuchen Sie das <a href="https://ab4babd7-978c-4acd-b78b-5f6332997961.lovableproject.com/tech-support" style="color: #2563eb; text-decoration: none; font-weight: 500;" target="_blank">Tech Support Dashboard</a>
          </p>
        </div>
      </body>
      </html>
    `;

    const results = [];
    
    // Send email to each recipient with delay to respect rate limits (2 requests per second)
    for (let i = 0; i < emails.length; i++) {
      const email = emails[i];
      
      try {
        console.log(`Attempting to send tech support notification to: ${email}`);
        
        const emailResponse = await resend.emails.send({
          from: "ABMedia Tech Support <noreply@empriadental.de>",
          to: [email],
          subject: emailSubject,
          html: emailHtml,
        });

        console.log(`Email sent successfully to ${email}:`, emailResponse);
        results.push({ email, success: true, id: emailResponse.data?.id });
      } catch (error) {
        console.error(`Failed to send email to ${email}:`, error);
        results.push({ email, success: false, error: error.message });
      }
      
      // Add 600ms delay between emails to respect Resend's rate limit (2 requests per second)
      if (i < emails.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 600));
      }
    }

    console.log(`Email sending completed. Results:`, results);

    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        message: `Tech support notification emails sent to ${emails.length} recipient(s)` 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error) {
    console.error("Error in send-tech-support-notification function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Unknown error occurred',
        details: error.toString()
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);