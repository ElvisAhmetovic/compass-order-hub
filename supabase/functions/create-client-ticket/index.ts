import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY_ABMEDIA"));

const NOTIFICATION_EMAILS = [
  'angelina@abmedia-team.com',
  'service@team-abmedia.com',
  'thomas.thomasklein@gmail.com',
  'invoice@team-abmedia.com',
  'jungabmedia@gmail.com',
  'wolfabmedia@gmail.com',
  'marcusabmedia@gmail.com',
  'paulkatz.abmedia@gmail.com',
  'ajosesales36@gmail.com',
  'georgabmediateam@gmail.com',
  'jannes@scoolfinanceedu.com',
  'Ikram@team-abmedia.com',
  'johan@team-abmedia.com'
];

const APP_URL = Deno.env.get("APP_URL") || "https://www.empriatech.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const redirectTo = (status: string, company?: string) => {
  const params = new URLSearchParams({ status });
  if (company) params.set("company", company);
  return new Response(null, {
    status: 302,
    headers: { ...corsHeaders, Location: `${APP_URL}/ticket-submitted?${params.toString()}` },
  });
};

// Fire-and-forget background work
const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const sendBackgroundNotifications = async (
  supabase: any,
  order: any,
  clientName: string,
  email: string,
  message: string,
  assignedTo: string | null
) => {
  const dashboardUrl = `${APP_URL}/customer-tickets`;
  const messageHtml = message
    ? escapeHtml(message).replace(/\n/g, "<br>")
    : "<em>No description provided.</em>";
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
          <p style="margin: 8px 0 0 0;"><strong>Portal account:</strong> ${
            assignedTo ? `linked to ${escapeHtml(assignedTo)}` : "no matching portal account found"
          }</p>
        </div>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 0 0 20px 0; border-left: 4px solid #1976d2;">
          <p style="margin: 0 0 8px 0;"><strong>Client message:</strong></p>
          <p style="margin: 0;">${messageHtml}</p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${dashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: bold; font-size: 16px;">View Customer Tickets</a>
        </div>
      </div>
      <div style="background: #f5f5f5; padding: 15px; border-radius: 0 0 10px 10px; text-align: center; font-size: 12px; color: #666;">
        <p style="margin: 0;">This is an automated notification from AB Media Team.</p>
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
};

const processTicket = async (
  orderId: string,
  email: string,
  message = "",
  clientSubject = ""
) => {
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
    return { status: "error" };
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
    return { status: "duplicate", company: order.company_name };
  }

  // Get client name
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

  const subject = clientSubject?.trim()
    ? clientSubject.trim().slice(0, 150)
    : `Support request for ${order.company_name}`;

  // Auto-link to an existing client portal account with the same email
  let portalUser: { id: string; email: string; full_name: string | null } | null = null;
  const { data: matchedUsers } = await supabase
    .from("app_users")
    .select("id, email, full_name")
    .eq("role", "client")
    .ilike("email", email)
    .limit(1);

  if (matchedUsers && matchedUsers.length > 0) {
    portalUser = matchedUsers[0];
  }

  // Insert ticket
  const { data: inserted, error: insertError } = await supabase
    .from("customer_tickets")
    .insert({
      order_id: orderId,
      client_email: email,
      client_name: clientName,
      company_name: order.company_name,
      subject,
      client_subject: clientSubject?.trim() || null,
      message: message?.trim() || null,
      status: "open",
      assigned_client_id: portalUser?.id ?? null,
      assigned_client_name: portalUser ? portalUser.full_name || portalUser.email : null,
      assigned_client_email: portalUser?.email ?? null,
    })
    .select("id")
    .maybeSingle();

  if (insertError) {
    console.error("Error creating ticket:", insertError);
    return { status: "error", company: order.company_name };
  }

  console.log("Customer ticket created for", email, "order", orderId, "ticket", inserted?.id);

  // If auto-linked, mirror it into the client portal support inbox
  if (portalUser) {
    const { error: inquiryError } = await supabase.from("support_inquiries").insert({
      user_id: portalUser.id,
      user_email: portalUser.email,
      user_name: portalUser.full_name || portalUser.email,
      subject,
      message: message?.trim() || `Support request from ${email}`,
      status: "open",
      order_id: orderId,
    });
    if (inquiryError) console.error("Portal inquiry insert failed:", inquiryError);
  }

  // Fire-and-forget: send emails and notifications in background
  sendBackgroundNotifications(
    supabase,
    order,
    clientName,
    email,
    message?.trim() || "",
    portalUser ? portalUser.full_name || portalUser.email : null
  ).catch((err) => console.error("Background notification error:", err));

  return { status: "success", company: order.company_name };
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // POST = JSON request from TicketLoading page
    if (req.method === "POST") {
      const { orderId, email } = await req.json();
      if (!orderId || !email) {
        return new Response(JSON.stringify({ status: "error" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const result = await processTicket(orderId, email);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // GET = legacy direct link fallback (redirect-based)
    const url = new URL(req.url);
    const orderId = url.searchParams.get("orderId");
    const email = url.searchParams.get("email");

    if (!orderId || !email) {
      return redirectTo("error");
    }

    const result = await processTicket(orderId, email);
    return redirectTo(result.status, result.company);
  } catch (error: any) {
    console.error("Error in create-client-ticket:", error);
    if (req.method === "POST") {
      return new Response(JSON.stringify({ status: "error" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return redirectTo("error");
  }
};

serve(handler);
