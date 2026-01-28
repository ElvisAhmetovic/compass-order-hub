import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SupportInquiryNotificationRequest {
  inquiryData: {
    id: string;
    subject: string;
    message: string;
    clientName: string;
    clientEmail: string;
    orderCompanyName?: string;
    createdAt: string;
  };
  emails: string[];
}

const generateEmailHtml = (data: SupportInquiryNotificationRequest["inquiryData"], appUrl: string): string => {
  const formattedDate = new Date(data.createdAt).toLocaleString("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const orderSection = data.orderCompanyName
    ? `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #eee;">
          <strong style="color: #666;">Linked Order:</strong>
        </td>
        <td style="padding: 10px 0; border-bottom: 1px solid #eee;">
          ${data.orderCompanyName}
        </td>
      </tr>
    `
    : "";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Support Inquiry</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="background-color: #2563eb; padding: 30px; border-radius: 8px 8px 0 0;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 24px;">New Support Inquiry</h1>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 30px;">
                  <p style="color: #333; font-size: 16px; margin: 0 0 20px 0;">
                    A new support inquiry has been submitted by a client.
                  </p>
                  
                  <!-- Client Info -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 25px;">
                    <tr>
                      <td style="padding: 10px 0; border-bottom: 1px solid #eee;">
                        <strong style="color: #666;">Client Name:</strong>
                      </td>
                      <td style="padding: 10px 0; border-bottom: 1px solid #eee;">
                        ${data.clientName}
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 0; border-bottom: 1px solid #eee;">
                        <strong style="color: #666;">Client Email:</strong>
                      </td>
                      <td style="padding: 10px 0; border-bottom: 1px solid #eee;">
                        <a href="mailto:${data.clientEmail}" style="color: #2563eb;">${data.clientEmail}</a>
                      </td>
                    </tr>
                    ${orderSection}
                    <tr>
                      <td style="padding: 10px 0; border-bottom: 1px solid #eee;">
                        <strong style="color: #666;">Submitted:</strong>
                      </td>
                      <td style="padding: 10px 0; border-bottom: 1px solid #eee;">
                        ${formattedDate}
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Subject -->
                  <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 15px; margin-bottom: 20px;">
                    <strong style="color: #333; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Subject</strong>
                    <p style="color: #1e40af; font-size: 18px; font-weight: bold; margin: 10px 0 0 0;">
                      ${data.subject}
                    </p>
                  </div>
                  
                  <!-- Message -->
                  <div style="background-color: #f8fafc; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
                    <strong style="color: #333; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Message</strong>
                    <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 10px 0 0 0; white-space: pre-wrap;">
${data.message}
                    </p>
                  </div>
                  
                  <!-- CTA Button -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center">
                        <a href="${appUrl}/support/${data.id}" 
                           style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                          View Inquiry in Dashboard
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; border-top: 1px solid #eee;">
                  <p style="color: #888; font-size: 12px; margin: 0; text-align: center;">
                    This is an automated notification from the AB Media Team support system.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { inquiryData, emails }: SupportInquiryNotificationRequest = await req.json();

    console.log("Received support inquiry notification request:", {
      inquiryId: inquiryData.id,
      subject: inquiryData.subject,
      clientName: inquiryData.clientName,
      recipientCount: emails.length,
    });

    // Validate required fields
    if (!inquiryData.id || !inquiryData.subject || !emails.length) {
      throw new Error("Missing required fields: inquiryData.id, inquiryData.subject, or emails");
    }

    // Define the background email sending task
    const sendEmailsInBackground = async () => {
      const appUrl = Deno.env.get("APP_URL") || "https://www.empriadental.de";
      const emailHtml = generateEmailHtml(inquiryData, appUrl);

      for (const email of emails) {
        try {
          console.log(`[Background] Sending email to: ${email}`);
          
          const { error } = await resend.emails.send({
            from: "AB Media Team <noreply@empriadental.de>",
            to: [email],
            subject: `New Support Inquiry: ${inquiryData.subject}`,
            html: emailHtml,
          });

          if (error) {
            console.error(`[Background] Failed to send to ${email}:`, error);
          } else {
            console.log(`[Background] Successfully sent to: ${email}`);
          }

          // Rate limiting: 600ms delay between sends
          await new Promise((resolve) => setTimeout(resolve, 600));
        } catch (sendError: any) {
          console.error(`[Background] Error sending to ${email}:`, sendError);
        }
      }
      console.log(`[Background] Email notification complete for inquiry ${inquiryData.id}`);
    };

    // Schedule background task - function continues running after response
    EdgeRuntime.waitUntil(sendEmailsInBackground());

    // Return immediately - client doesn't wait for emails
    return new Response(
      JSON.stringify({
        success: true,
        message: "Inquiry received, email notifications queued",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-support-inquiry-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
