import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY_ABMEDIA"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Team email addresses to CC on client reminders
const TEAM_EMAILS = [
  "angelina@abmedia-team.com",
  "service@team-abmedia.com",
  "thomas.thomasklein@gmail.com",
  "kleinabmedia@gmail.com",
  "jungabmedia@gmail.com",
  "wolfabmedia@gmail.com",
  "marcusabmedia@gmail.com",
  "paulkatz.abmedia@gmail.com",
  "ajosesales36@gmail.com",
  "georgabmediateam@gmail.com",
  "jannes@scoolfinanceedu.com",
];

interface ClientReminderRequest {
  clientEmail: string;
  companyName: string;
  contactPhone: string | null;
  orderCreatedAt: string;
  orderDescription: string | null;
  orderPrice: number | null;
  orderCurrency: string;
  customMessage: string | null;
  orderId: string;
  sentByName: string;
  sentById: string | null;
  // New template fields
  emailSubject?: string;
  emailBodyHtml?: string;
  templateId?: string;
  templateName?: string;
}

const formatPrice = (price: number | null, currency: string): string => {
  if (price === null || price === undefined) return "N/A";
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: currency || "EUR",
  }).format(price);
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("de-DE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
};

// Default email template when no custom template is provided
const getDefaultEmailHtml = (
  companyName: string,
  clientEmail: string,
  contactPhone: string | null,
  formattedDate: string,
  orderDescription: string | null,
  formattedPrice: string,
  customMessage: string | null
): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Reminder</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; border-radius: 10px 10px 0 0;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">💰 Payment Reminder</h1>
        <p style="color: #a0a0a0; margin: 10px 0 0 0;">AB Media Team</p>
      </div>
      
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
        <p style="font-size: 16px; margin-bottom: 20px;">Dear <strong>${companyName}</strong>,</p>
        
        <p style="margin-bottom: 20px;">We hope this message finds you well. This is a friendly reminder regarding your outstanding payment for the services we provided.</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <h3 style="margin: 0 0 15px 0; color: #1a1a2e;">Order Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #666;">Company Name:</td>
              <td style="padding: 8px 0; font-weight: bold;">${companyName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">Contact Email:</td>
              <td style="padding: 8px 0;">${clientEmail}</td>
            </tr>
            ${contactPhone ? `
            <tr>
              <td style="padding: 8px 0; color: #666;">Phone Number:</td>
              <td style="padding: 8px 0;">${contactPhone}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 8px 0; color: #666;">Order Date:</td>
              <td style="padding: 8px 0;">${formattedDate}</td>
            </tr>
            ${orderDescription ? `
            <tr>
              <td style="padding: 8px 0; color: #666;">Service:</td>
              <td style="padding: 8px 0;">${orderDescription}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 8px 0; color: #666;">Amount Due:</td>
              <td style="padding: 8px 0; font-weight: bold; font-size: 18px; color: #d32f2f;">${formattedPrice}</td>
            </tr>
          </table>
        </div>
        
        ${customMessage ? `
        <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; font-style: italic;">"${customMessage}"</p>
        </div>
        ` : ''}
        
        <p style="margin: 20px 0;">We kindly request that you complete your payment at your earliest convenience. If you have any questions or concerns regarding this invoice, please don't hesitate to reach out to us.</p>
        
        <div style="background: #fff3e0; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff9800;">
          <p style="margin: 0; font-weight: bold;">📞 Need assistance?</p>
          <p style="margin: 10px 0 0 0;">Contact us at <a href="mailto:service@team-abmedia.com" style="color: #1976d2;">service@team-abmedia.com</a></p>
        </div>
        
        <p style="margin-top: 30px;">Thank you for your business and continued partnership.</p>
        
        <p style="margin-top: 20px;">
          Best regards,<br>
          <strong>AB Media Team</strong>
        </p>
      </div>
      
      <div style="background: #f5f5f5; padding: 20px; border-radius: 0 0 10px 10px; text-align: center; font-size: 12px; color: #666;">
        <p style="margin: 0;">This is an automated payment reminder from AB Media Team.</p>
        <p style="margin: 5px 0 0 0;">If you have already made the payment, please disregard this message.</p>
      </div>
    </body>
    </html>
  `;
};

// Wrap custom template body in email wrapper
const wrapTemplateInEmailWrapper = (bodyHtml: string): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Reminder</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; border-radius: 10px 10px 0 0;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">💰 Payment Reminder</h1>
        <p style="color: #a0a0a0; margin: 10px 0 0 0;">AB Media Team</p>
      </div>
      
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
        ${bodyHtml}
      </div>
      
      <div style="background: #f5f5f5; padding: 20px; border-radius: 0 0 10px 10px; text-align: center; font-size: 12px; color: #666;">
        <p style="margin: 0;">This is an automated payment reminder from AB Media Team.</p>
        <p style="margin: 5px 0 0 0;">If you have already made the payment, please disregard this message.</p>
      </div>
    </body>
    </html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      clientEmail,
      companyName,
      contactPhone,
      orderCreatedAt,
      orderDescription,
      orderPrice,
      orderCurrency,
      customMessage,
      orderId,
      sentByName,
      sentById,
      emailSubject,
      emailBodyHtml,
      templateId,
      templateName,
    }: ClientReminderRequest = await req.json();

    console.log(`Sending client payment reminder to ${clientEmail} for order ${orderId} by ${sentByName}`);
    if (templateName) {
      console.log(`Using template: ${templateName} (${templateId})`);
    }

    const formattedPrice = formatPrice(orderPrice, orderCurrency);
    const formattedDate = formatDate(orderCreatedAt);

    // Determine email content - use custom template if provided, otherwise use default
    let finalEmailHtml: string;
    let finalSubject: string;

    if (emailBodyHtml && emailSubject) {
      // Use custom template
      finalEmailHtml = wrapTemplateInEmailWrapper(emailBodyHtml);
      finalSubject = emailSubject;
      console.log("Using custom email template");
    } else {
      // Use default template
      finalEmailHtml = getDefaultEmailHtml(
        companyName,
        clientEmail,
        contactPhone,
        formattedDate,
        orderDescription,
        formattedPrice,
        customMessage
      );
      finalSubject = `💰 Payment Reminder - AB Media Team - ${formattedPrice}`;
      console.log("Using default email template");
    }

    // Send email to client
    console.log(`Sending payment reminder email to client: ${clientEmail}`);
    const clientEmailResponse = await resend.emails.send({
      from: "AB Media Team <noreply@abm-team.com>",
      to: [clientEmail],
      subject: finalSubject,
      html: finalEmailHtml,
    });

    if (clientEmailResponse.error) {
      console.error("Error sending email to client:", clientEmailResponse.error);
      throw new Error(`Failed to send email to client: ${clientEmailResponse.error.message}`);
    }

    console.log(`Successfully sent email to client: ${clientEmail}`, clientEmailResponse);

    // Add delay before sending team notifications to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));

    // Build team notification email
    // Always use "Thomas Klein" as the sender name for team notifications
    const displaySenderName = "Thomas Klein";
    
    const teamEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Client Payment Reminder Sent</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%); padding: 20px; border-radius: 10px 10px 0 0;">
          <h1 style="color: #ffffff; margin: 0; font-size: 20px;">✅ Client Payment Reminder Sent</h1>
        </div>
        
        <div style="background: #ffffff; padding: 20px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
          <p>A payment reminder has been sent to the following client by <strong>${displaySenderName}</strong>:</p>
          
          <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 5px 0; color: #666;">Company:</td>
                <td style="padding: 5px 0; font-weight: bold;">${companyName}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: #666;">Client Email:</td>
                <td style="padding: 5px 0;">${clientEmail}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: #666;">Amount:</td>
                <td style="padding: 5px 0; font-weight: bold;">${formattedPrice}</td>
              </tr>
              ${templateName ? `
              <tr>
                <td style="padding: 5px 0; color: #666;">Template Used:</td>
                <td style="padding: 5px 0;">${templateName}</td>
              </tr>
              ` : ''}
              ${customMessage ? `
              <tr>
                <td style="padding: 5px 0; color: #666;">Custom Message:</td>
                <td style="padding: 5px 0;">${customMessage}</td>
              </tr>
              ` : ''}
            </table>
          </div>
          
          <p style="font-size: 12px; color: #666; margin-top: 15px;">This is an automated notification from the AB Media order management system.</p>
        </div>
      </body>
      </html>
    `;

    // Send notification to team with delay between sends
    let teamEmailsSent = 0;
    const teamEmailErrors: string[] = [];

    for (const teamEmail of TEAM_EMAILS) {
      try {
        await resend.emails.send({
          from: "AB Media Team <noreply@abm-team.com>",
          to: [teamEmail],
          subject: `✅ Client Reminder Sent: ${companyName} - ${formattedPrice}`,
          html: teamEmailHtml,
        });
        teamEmailsSent++;
        console.log(`Team notification sent to: ${teamEmail}`);
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Failed to send team notification to ${teamEmail}:`, error);
        teamEmailErrors.push(teamEmail);
      }
    }

    // Log to database
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

      const { error: logError } = await supabaseClient
        .from("client_email_logs")
        .insert({
          order_id: orderId,
          sent_to: clientEmail,
          sent_by: sentById || null,
          sent_by_name: sentByName,
          company_name: companyName,
          order_price: orderPrice,
          currency: orderCurrency || "EUR",
          custom_message: customMessage || null,
          team_emails_sent: teamEmailsSent,
        });

      if (logError) {
        console.error("Error logging email to database:", logError);
      } else {
        console.log("Email log saved to database successfully");
      }

      // Also log to payment_reminder_logs for the Activity Log panel
      const { error: reminderLogError } = await supabaseClient
        .from("payment_reminder_logs")
        .insert({
          order_id: orderId,
          reminder_id: null,
          action: "sent",
          actor_name: displaySenderName,
          company_name: companyName,
          details: {
            type: "client_email",
            sent_to: clientEmail,
            amount: formattedPrice,
            template_used: templateName || "Default",
          },
        });

      if (reminderLogError) {
        console.error("Error logging to payment_reminder_logs:", reminderLogError);
      } else {
        console.log("Activity log saved to payment_reminder_logs successfully");
      }
    } catch (dbError) {
      console.error("Error connecting to database for logging:", dbError);
    }

    console.log(`Client payment reminder completed. Client email sent: true, Team emails sent: ${teamEmailsSent}/${TEAM_EMAILS.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        clientEmailSent: true,
        teamEmailsSent,
        teamEmailErrors,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-client-payment-reminder function:", error);
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
