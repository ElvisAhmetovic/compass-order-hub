import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY_ABMEDIA"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ClientStatusNotificationRequest {
  orderId: string;
  oldStatus: string | null;
  newStatus: string;
  changedBy: {
    id: string;
    name: string;
  };
  customMessage?: string;
}

const APP_URL = Deno.env.get("APP_URL") || "https://www.empriadental.de";

const getClientEmailHtml = (
  clientName: string,
  companyName: string,
  oldStatus: string | null,
  newStatus: string,
  portalUrl: string,
  customMessage?: string
): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Status Update</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; border-radius: 10px 10px 0 0;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">📦 Order Status Update</h1>
        <p style="color: #a0a0a0; margin: 10px 0 0 0;">AB Media Team</p>
      </div>
      
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
        <p style="font-size: 16px; margin-bottom: 20px;">Dear <strong>${clientName}</strong>,</p>
        
        <p style="margin-bottom: 20px;">There has been an update to your order:</p>
        
        <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4caf50;">
          <h3 style="margin: 0 0 15px 0; color: #1a1a2e;">Order: ${companyName}</h3>
          <div style="text-align: center; margin: 15px 0;">
            ${oldStatus ? `
              <span style="background: #e0e7ff; color: #4338ca; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600;">
                ${oldStatus}
              </span>
              <span style="margin: 0 10px; font-size: 20px;">→</span>
            ` : ''}
            <span style="background: #d1fae5; color: #065f46; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600;">
              ${newStatus}
            </span>
          </div>
        </div>

        ${customMessage ? `
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1976d2;">
          <h3 style="margin: 0 0 10px 0; color: #1a1a2e; font-size: 14px;">💬 Message from our team:</h3>
          <p style="margin: 0; white-space: pre-wrap; line-height: 1.6;">${customMessage}</p>
        </div>
        ` : ''}
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${portalUrl}" style="display: inline-block; background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: bold; font-size: 16px;">View in Client Portal</a>
        </div>
        
        <div style="background: #fff3e0; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff9800;">
          <p style="margin: 0; font-weight: bold;">📞 Questions about your order?</p>
          <p style="margin: 10px 0 0 0;">Contact us at <a href="mailto:service@team-abmedia.com" style="color: #1976d2;">service@team-abmedia.com</a></p>
        </div>
        
        <p style="margin-top: 30px;">Thank you for your business!</p>
        
        <p style="margin-top: 20px;">
          Best regards,<br>
          <strong>AB Media Team</strong>
        </p>
      </div>
      
      <div style="background: #f5f5f5; padding: 20px; border-radius: 0 0 10px 10px; text-align: center; font-size: 12px; color: #666;">
        <p style="margin: 0;">This is an automated message from AB Media Team.</p>
      </div>
    </body>
    </html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId, oldStatus, newStatus, changedBy, customMessage }: ClientStatusNotificationRequest = await req.json();

    console.log("Client status notification triggered:", {
      orderId,
      oldStatus,
      newStatus,
      changedBy,
      hasCustomMessage: !!customMessage,
    });

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch order details with client_id
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      console.error("Error fetching order:", orderError);
      return new Response(
        JSON.stringify({ error: "Order not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if order has a linked client
    if (!order.client_id) {
      console.log("No client linked to this order, skipping notification");
      return new Response(
        JSON.stringify({ message: "No client linked to this order" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch client profile
    const { data: clientProfile, error: profileError } = await supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .eq("id", order.client_id)
      .single();

    if (profileError || !clientProfile) {
      console.error("Error fetching client profile:", profileError);
      return new Response(
        JSON.stringify({ error: "Client profile not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch client email from app_users
    const { data: appUser, error: appUserError } = await supabase
      .from("app_users")
      .select("email")
      .eq("id", order.client_id)
      .single();

    if (appUserError || !appUser?.email) {
      console.error("Error fetching client email:", appUserError);
      return new Response(
        JSON.stringify({ error: "Client email not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const clientName = `${clientProfile.first_name || ''} ${clientProfile.last_name || ''}`.trim() || "Valued Customer";
    const clientEmail = appUser.email;
    const portalUrl = `${APP_URL}/client/orders`;

    const emailHtml = getClientEmailHtml(
      clientName,
      order.company_name,
      oldStatus,
      newStatus,
      portalUrl,
      customMessage
    );

    const emailSubject = `📦 Order Update: ${order.company_name} - ${newStatus}`;

    // Send email to client
    const emailResponse = await resend.emails.send({
      from: "Thomas Klein <ThomasKlein@abm-team.com>",
      to: [clientEmail],
      subject: emailSubject,
      html: emailHtml,
    });

    if (emailResponse.error) {
      console.error("Error sending client notification:", emailResponse.error);
      throw new Error(`Failed to send email: ${emailResponse.error.message}`);
    }

    console.log(`Client notification sent to ${clientEmail}`, emailResponse);

    // Log to order_audit_logs
    const { error: logError } = await supabase
      .from("order_audit_logs")
      .insert({
        order_id: orderId,
        actor_id: changedBy.id || null,
        action: customMessage ? "Manual Client Update Sent" : "Auto Client Status Update Sent",
        details: `Email sent to ${clientName} (${clientEmail}): Status ${oldStatus ? `${oldStatus} → ` : ''}${newStatus}${customMessage ? ` with message` : ''}`,
      });

    if (logError) {
      console.error("Error logging to audit:", logError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Notification sent to ${clientEmail}`,
        emailId: emailResponse.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-client-status-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
