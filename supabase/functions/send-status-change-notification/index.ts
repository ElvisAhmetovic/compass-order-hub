import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface StatusChangeRequest {
  orderId: string;
  oldStatus: string | null;
  newStatus: string;
  changedBy: {
    id: string;
    name: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId, oldStatus, newStatus, changedBy }: StatusChangeRequest = await req.json();

    console.log("Status change notification triggered:", {
      orderId,
      oldStatus,
      newStatus,
      changedBy,
    });

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch notification settings
    const { data: settings, error: settingsError } = await supabase
      .from("notification_settings")
      .select("*")
      .limit(1)
      .single();

    if (settingsError || !settings) {
      console.error("Error fetching notification settings:", settingsError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch notification settings" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if notifications are enabled globally
    if (!settings.enabled) {
      console.log("Notifications disabled globally");
      return new Response(
        JSON.stringify({ message: "Notifications disabled" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if notification is enabled for this specific status
    const statusKey = `notify_on_status_${newStatus.toLowerCase().replace(/ /g, "_")}`;
    if (settings[statusKey] === false) {
      console.log(`Notifications disabled for status: ${newStatus}`);
      return new Response(
        JSON.stringify({ message: `Notifications disabled for ${newStatus}` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if there are recipients
    if (!settings.recipient_emails || settings.recipient_emails.length === 0) {
      console.log("No recipient emails configured");
      return new Response(
        JSON.stringify({ error: "No recipient emails configured" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch order details
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

    // Generate email content
    const emailSubject = `[CSM Alert] Status Update: ${order.company_name} - ${oldStatus || "New"} → ${newStatus}`;
    const dashboardLink = `https://fjybmlugiqmiggsdrkiq.supabase.co/dashboard/orders/${orderId}`;
    const timestamp = new Date().toLocaleString("en-US", {
      dateStyle: "full",
      timeStyle: "short",
    });

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Status Update Alert</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
  
  <!-- Header -->
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; color: white;">
    <h1 style="margin: 0; font-size: 24px;">🔔 Order Status Changed</h1>
    <p style="margin: 10px 0 0 0; opacity: 0.9;">CSM Notification Alert</p>
  </div>

  <!-- Status Change Box -->
  <div style="background: white; margin: 20px 0; padding: 25px; border-radius: 8px; border-left: 5px solid #667eea;">
    <div style="text-align: center;">
      <span style="background: #e0e7ff; color: #4338ca; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600;">
        ${oldStatus || "New"}
      </span>
      <span style="margin: 0 15px; font-size: 24px;">→</span>
      <span style="background: #d1fae5; color: #065f46; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600;">
        ${newStatus}
      </span>
    </div>
  </div>

  <!-- Order Details Card -->
  <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
      📋 Order Information
    </h2>
    
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 10px 0; color: #6b7280; font-weight: 600;">Company:</td>
        <td style="padding: 10px 0; color: #1f2937;">${order.company_name}</td>
      </tr>
      <tr>
        <td style="padding: 10px 0; color: #6b7280; font-weight: 600;">Order ID:</td>
        <td style="padding: 10px 0; color: #1f2937; font-family: monospace;">${orderId.substring(0, 8)}</td>
      </tr>
      <tr>
        <td style="padding: 10px 0; color: #6b7280; font-weight: 600;">Client:</td>
        <td style="padding: 10px 0; color: #1f2937;">${order.contact_email || "N/A"}</td>
      </tr>
      <tr>
        <td style="padding: 10px 0; color: #6b7280; font-weight: 600;">Assigned To:</td>
        <td style="padding: 10px 0; color: #1f2937;">${order.assigned_to_name || "Unassigned"}</td>
      </tr>
      <tr>
        <td style="padding: 10px 0; color: #6b7280; font-weight: 600;">Price:</td>
        <td style="padding: 10px 0; color: #059669; font-weight: 700; font-size: 18px;">${order.price ? `${order.currency || "EUR"} ${order.price}` : "N/A"}</td>
      </tr>
    </table>
  </div>

  <!-- Change Details Box -->
  <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #f59e0b;">
    <p style="margin: 0 0 8px 0; color: #92400e; font-weight: 600;">
      <strong>Changed by:</strong> ${changedBy.name}
    </p>
    <p style="margin: 0; color: #92400e; font-size: 14px;">
      <strong>Date/Time:</strong> ${timestamp}
    </p>
  </div>

  ${order.internal_notes ? `
  <!-- Internal Notes -->
  <div style="background: #fee2e2; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #dc2626;">
    <h3 style="margin: 0 0 10px 0; color: #7f1d1d; font-size: 16px;">🔒 Internal Notes:</h3>
    <p style="margin: 0; color: #991b1b; white-space: pre-wrap; line-height: 1.6;">${order.internal_notes}</p>
  </div>
  ` : ""}

  <!-- Action Button -->
  <div style="text-align: center; margin: 30px 0;">
    <a href="${dashboardLink}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
      View Order in Dashboard →
    </a>
  </div>

  <!-- Footer -->
  <div style="text-align: center; color: #6b7280; font-size: 13px; padding: 20px 0; border-top: 1px solid #e5e7eb;">
    <p style="margin: 0 0 5px 0;">This is an automated notification from your CSM system</p>
    <p style="margin: 0;">You're receiving this because you're in the notification recipients list</p>
  </div>
  
</body>
</html>
    `;

    // Send emails with rate limiting
    const results = [];
    for (let i = 0; i < settings.recipient_emails.length; i++) {
      const email = settings.recipient_emails[i];
      
      try {
        const emailResponse = await resend.emails.send({
          from: "Empria Dental <noreply@empriadental.de>",
          to: [email],
          subject: emailSubject,
          html: emailHtml,
        });

        console.log(`Email sent to ${email}:`, emailResponse);
        results.push({ email, success: true, id: emailResponse.id });

        // Rate limiting: wait 600ms between emails
        if (i < settings.recipient_emails.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 600));
        }
      } catch (emailError: any) {
        console.error(`Failed to send email to ${email}:`, emailError);
        results.push({ email, success: false, error: emailError.message });
      }
    }

    // Log notification
    const { error: logError } = await supabase
      .from("notification_logs")
      .insert({
        order_id: orderId,
        status_change: `${oldStatus || "New"} → ${newStatus}`,
        old_status: oldStatus,
        new_status: newStatus,
        changed_by_id: changedBy.id,
        changed_by_name: changedBy.name,
        recipient_emails: settings.recipient_emails,
        email_subject: emailSubject,
        email_sent: results.some((r) => r.success),
        email_error: results.some((r) => !r.success)
          ? results.filter((r) => !r.success).map((r) => r.error).join(", ")
          : null,
        sent_at: new Date().toISOString(),
      });

    if (logError) {
      console.error("Error logging notification:", logError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        results,
        message: `Notifications sent to ${results.filter((r) => r.success).length} of ${results.length} recipients`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-status-change-notification:", error);
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
