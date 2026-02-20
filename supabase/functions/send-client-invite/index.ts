import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY_ABMEDIA"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ClientInviteRequest {
  clientEmail: string;
  clientName: string;
  orderId: string;
  companyName: string;
  senderName: string;
  senderId: string | null;
}

const APP_URL = Deno.env.get("APP_URL") || "https://www.empriadental.de";

const getInviteEmailHtml = (
  clientName: string,
  companyName: string,
  portalUrl: string
): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Client Portal Access</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; border-radius: 10px 10px 0 0;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">🔐 Client Portal Access</h1>
        <p style="color: #a0a0a0; margin: 10px 0 0 0;">AB Media Team</p>
      </div>
      
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
        <p style="font-size: 16px; margin-bottom: 20px;">Dear <strong>${clientName}</strong>,</p>
        
        <p style="margin-bottom: 20px;">You have been granted access to the AB Media Client Portal where you can track your orders and view their progress.</p>
        
        <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4caf50;">
          <h3 style="margin: 0 0 15px 0; color: #1a1a2e;">Your Order</h3>
          <p style="margin: 0;"><strong>Company:</strong> ${companyName}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${portalUrl}" style="display: inline-block; background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: bold; font-size: 16px;">Access Client Portal</a>
        </div>
        
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px;"><strong>Portal URL:</strong></p>
          <p style="margin: 5px 0 0 0;"><a href="${portalUrl}" style="color: #1976d2; word-break: break-all;">${portalUrl}</a></p>
        </div>
        
        <p style="margin: 20px 0;">In the portal, you can:</p>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>View your order status and progress</li>
          <li>See order details and attachments</li>
          <li>Track invoice status</li>
          <li>Contact our support team</li>
        </ul>
        
        <div style="background: #fff3e0; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff9800;">
          <p style="margin: 0; font-weight: bold;">📞 Need assistance?</p>
          <p style="margin: 10px 0 0 0;">Contact us at <a href="mailto:service@team-abmedia.com" style="color: #1976d2;">service@team-abmedia.com</a></p>
        </div>
        
        <p style="margin-top: 30px;">Thank you for choosing AB Media!</p>
        
        <p style="margin-top: 20px;">
          Best regards,<br>
          <strong>AB Media Team</strong>
        </p>
      </div>
      
      <div style="background: #f5f5f5; padding: 20px; border-radius: 0 0 10px 10px; text-align: center; font-size: 12px; color: #666;">
        <p style="margin: 0;">This is an automated message from AB Media Team.</p>
        <p style="margin: 5px 0 0 0;">If you did not expect this email, please contact us.</p>
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
      clientName,
      orderId,
      companyName,
      senderName,
      senderId,
    }: ClientInviteRequest = await req.json();

    console.log(`Sending client portal invite to ${clientEmail} for order ${orderId}`);

    // Validate required fields
    if (!clientEmail || !clientName || !orderId || !companyName) {
      throw new Error("Missing required fields: clientEmail, clientName, orderId, or companyName");
    }

    const portalUrl = `${APP_URL}/client/login`;

    const emailHtml = getInviteEmailHtml(clientName, companyName, portalUrl);

    // Send email to client
    const emailResponse = await resend.emails.send({
      from: "Thomas Klein <ThomasKlein@abm-team.com>",
      to: [clientEmail],
      subject: `🔐 Client Portal Access - ${companyName} - AB Media Team`,
      html: emailHtml,
    });

    if (emailResponse.error) {
      console.error("Error sending invite email:", emailResponse.error);
      throw new Error(`Failed to send email: ${emailResponse.error.message}`);
    }

    console.log(`Successfully sent invite email to ${clientEmail}`, emailResponse);

    // Log to order_audit_logs
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

      const { error: logError } = await supabaseClient
        .from("order_audit_logs")
        .insert({
          order_id: orderId,
          actor_id: senderId || null,
          action: "Login Invite Sent",
          details: `Client portal invite sent to ${clientName} (${clientEmail})`,
        });

      if (logError) {
        console.error("Error logging invite to database:", logError);
      } else {
        console.log("Invite logged to order_audit_logs successfully");
      }
    } catch (dbError) {
      console.error("Error connecting to database for logging:", dbError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Invite sent to ${clientEmail}`,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-client-invite function:", error);
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
