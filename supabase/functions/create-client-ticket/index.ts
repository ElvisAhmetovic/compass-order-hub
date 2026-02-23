import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY_ABMEDIA"));

const NOTIFICATION_EMAILS = [
  'angelina@abmedia-team.com',
  'service@team-abmedia.com',
  'thomas.thomasklein@gmail.com',
  'kleinabmedia@gmail.com',
  'jungabmedia@gmail.com',
  'wolfabmedia@gmail.com',
  'marcusabmedia@gmail.com',
  'paulkatz.abmedia@gmail.com',
  'ajosesales36@gmail.com',
  'georgabmediateam@gmail.com',
  'jannes@scoolfinanceedu.com'
];

const APP_URL = Deno.env.get("APP_URL") || "https://www.empriadental.de";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const getConfirmationHtml = (companyName: string): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ticket Submitted</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f5f5f5; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
    .card { background: white; border-radius: 12px; padding: 40px; max-width: 500px; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .icon { font-size: 48px; margin-bottom: 16px; }
    h1 { color: #1a1a2e; font-size: 24px; margin-bottom: 12px; }
    p { color: #666; line-height: 1.6; }
    .company { color: #1976d2; font-weight: bold; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">✅</div>
    <h1>Ticket Submitted Successfully</h1>
    <p>Your support request for <span class="company">${companyName}</span> has been received.</p>
    <p>Our team has been notified and will contact you shortly.</p>
  </div>
</body>
</html>
`;

const getDuplicateHtml = (): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ticket Already Submitted</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f5f5f5; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
    .card { background: white; border-radius: 12px; padding: 40px; max-width: 500px; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .icon { font-size: 48px; margin-bottom: 16px; }
    h1 { color: #1a1a2e; font-size: 24px; margin-bottom: 12px; }
    p { color: #666; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">📋</div>
    <h1>Ticket Already Submitted</h1>
    <p>You have already submitted a support request for this order recently.</p>
    <p>Our team has been notified and will contact you shortly.</p>
  </div>
</body>
</html>
`;

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const orderId = url.searchParams.get("orderId");
    const email = url.searchParams.get("email");

    if (!orderId || !email) {
      return new Response("<h1>Invalid request</h1>", {
        status: 400,
        headers: { "Content-Type": "text/html", ...corsHeaders },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, company_name, contact_email, contact_phone, company_id")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      console.error("Order not found:", orderError);
      return new Response("<h1>Order not found</h1>", {
        status: 404,
        headers: { "Content-Type": "text/html", ...corsHeaders },
      });
    }

    // Check for duplicate ticket in last 5 minutes
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: existing } = await supabase
      .from("customer_tickets")
      .select("id")
      .eq("order_id", orderId)
      .eq("client_email", email)
      .gte("created_at", fiveMinAgo)
      .limit(1);

    if (existing && existing.length > 0) {
      console.log("Duplicate ticket prevented for", email, orderId);
      return new Response(getDuplicateHtml(), {
        status: 200,
        headers: { "Content-Type": "text/html", ...corsHeaders },
      });
    }

    // Get client name from company contact_person if available
    let clientName = email;
    if (order.company_id) {
      const { data: company } = await supabase
        .from("companies")
        .select("contact_person")
        .eq("id", order.company_id)
        .single();
      if (company?.contact_person) {
        clientName = company.contact_person;
      }
    }

    const subject = `Support request for ${order.company_name}`;

    // Insert ticket
    const { error: insertError } = await supabase
      .from("customer_tickets")
      .insert({
        order_id: orderId,
        client_email: email,
        client_name: clientName,
        company_name: order.company_name,
        subject,
        status: "open",
      });

    if (insertError) {
      console.error("Error creating ticket:", insertError);
      return new Response("<h1>Error creating ticket</h1>", {
        status: 500,
        headers: { "Content-Type": "text/html", ...corsHeaders },
      });
    }

    console.log("Customer ticket created for", email, "order", orderId);

    // Send team notification email
    const dashboardUrl = `${APP_URL}/customer-tickets`;
    const teamEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; border-radius: 10px 10px 0 0;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">🎫 New Customer Ticket</h1>
          <p style="color: #a0a0a0; margin: 10px 0 0 0;">A client is requesting support</p>
        </div>
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
          <div style="background: #fff3e0; padding: 20px; border-radius: 8px; margin: 0 0 20px 0; border-left: 4px solid #ff9800;">
            <p style="margin: 0;"><strong>Client:</strong> ${clientName}</p>
            <p style="margin: 8px 0 0 0;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 8px 0 0 0;"><strong>Company:</strong> ${order.company_name}</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${dashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: bold; font-size: 16px;">View Customer Tickets</a>
          </div>
        </div>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 0 0 10px 10px; text-align: center; font-size: 12px; color: #666;">
          <p style="margin: 0;">This is an automated notification from Empria.</p>
        </div>
      </body>
      </html>
    `;

    // Send emails with delay to avoid rate limiting
    for (let i = 0; i < NOTIFICATION_EMAILS.length; i++) {
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      try {
        await resend.emails.send({
          from: "Thomas Klein <ThomasKlein@abm-team.com>",
          to: [NOTIFICATION_EMAILS[i]],
          subject: `🎫 New Customer Ticket: ${order.company_name} - ${clientName}`,
          html: teamEmailHtml,
        });
      } catch (emailErr) {
        console.error(`Failed to send to ${NOTIFICATION_EMAILS[i]}:`, emailErr);
      }
    }

    // Create in-app notifications for admins
    const { data: admins } = await supabase
      .from("profiles")
      .select("id")
      .in("role", ["admin", "agent"]);

    if (admins) {
      for (const admin of admins) {
        await supabase.from("notifications").insert({
          user_id: admin.id,
          title: "New Customer Ticket",
          message: `${clientName} (${order.company_name}) has requested support`,
          type: "info",
          action_url: "/customer-tickets",
        });
      }
    }

    return new Response(getConfirmationHtml(order.company_name), {
      status: 200,
      headers: { "Content-Type": "text/html", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in create-client-ticket:", error);
    return new Response("<h1>Something went wrong</h1>", {
      status: 500,
      headers: { "Content-Type": "text/html", ...corsHeaders },
    });
  }
};

serve(handler);
