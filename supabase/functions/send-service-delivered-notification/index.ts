import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // JWT authentication check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const resend = new Resend(Deno.env.get("RESEND_API_KEY_ABMEDIA"));
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const appUrl = Deno.env.get("APP_URL") || "https://www.empriadental.de";
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { orderId, changedBy } = await req.json();

    if (!orderId) {
      throw new Error("orderId is required");
    }

    // Fetch order details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      throw new Error(`Order not found: ${orderError?.message}`);
    }

    if (!order.contact_email) {
      console.log("No contact_email on order, skipping service delivered email");
      return new Response(JSON.stringify({ success: false, reason: "no_contact_email" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch company details for contact_person
    let contactPerson = order.company_name;
    if (order.company_id) {
      const { data: company } = await supabase
        .from("companies")
        .select("contact_person, name")
        .eq("id", order.company_id)
        .single();
      if (company?.contact_person) {
        contactPerson = company.contact_person;
      }
    }

    // Fetch linked invoice (if any) - look for invoices linked to this order's company
    let invoiceNumber = "–";
    let invoiceAmount = "–";
    let invoiceLink = "";

    // Try to find invoice by checking client_email_logs or by matching company
    // For now, check if there's an invoice with matching client
    if (order.company_id) {
      const { data: invoices } = await supabase
        .from("invoices")
        .select("invoice_number, total_amount, currency, id")
        .order("created_at", { ascending: false })
        .limit(5);

      // Find an invoice that might match this order (best effort)
      if (invoices && invoices.length > 0) {
        const invoice = invoices[0]; // Most recent
        invoiceNumber = invoice.invoice_number;
        const amount = invoice.total_amount || order.price || 0;
        invoiceAmount = new Intl.NumberFormat("de-DE", {
          style: "currency",
          currency: invoice.currency || "EUR",
        }).format(amount);
        invoiceLink = `${appUrl}/invoices/${invoice.id}`;
      }
    }

    // Fallback: use order price if no invoice found
    if (invoiceAmount === "–" && order.price) {
      invoiceAmount = new Intl.NumberFormat("de-DE", {
        style: "currency",
        currency: order.currency || "EUR",
      }).format(order.price);
    }

    const ticketId = orderId.substring(0, 8).toUpperCase();
    const serviceName = order.description || "Dienstleistung";
    const serviceLiveLink = order.company_link || "";
    const todayDate = new Date().toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    // Complaint link: portal if client_id exists, else mailto
    let ticketReplyLink: string;
    if (order.client_id) {
      ticketReplyLink = `${appUrl}/client/support?complaint=true&orderId=${orderId}`;
    } else {
      ticketReplyLink = `mailto:service@team-abmedia.com?subject=Einwand%20zu%20Auftrag%20${ticketId}`;
    }

    const subject = `Dienstleistung abgeschlossen – Bitte prüfen & Rechnung begleichen (AB MEDIA TEAM)`;

    const htmlBody = `
<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, Helvetica, sans-serif; color: #222; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="border-bottom: 3px solid #2563eb; padding-bottom: 16px; margin-bottom: 24px;">
    <h2 style="margin: 0; color: #2563eb;">AB MEDIA TEAM</h2>
  </div>

  <p>Sehr geehrte/r <strong>${contactPerson}</strong>,</p>

  <p>wir möchten Sie hiermit informieren, dass die von Ihnen beauftragte Dienstleistung
  (<strong>${serviceName}</strong>, Ticket-Nr. <strong>${ticketId}</strong>) erfolgreich abgeschlossen wurde.</p>

  ${serviceLiveLink ? `
  <p>Sie können unser Ergebnis hier live überprüfen:</p>
  <p style="margin: 16px 0;">
    <a href="${serviceLiveLink}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
      Ergebnis ansehen
    </a>
  </p>
  ` : ""}

  <p>Sollten Sie mit der erbrachten Leistung nicht einverstanden sein oder der Meinung sein,
  dass etwas korrigiert bzw. angepasst werden muss, können Sie direkt über folgenden Link
  eine Rückmeldung geben bzw. einen Hinweis/Einwand einreichen:</p>

  <p>Sofern Sie keinen Einwand einreichen, gilt die Leistung mit heutigem Datum
  (<strong>${todayDate}</strong>) als ordnungsgemäß erbracht und die zugehörige Rechnung
  Nr. <strong>${invoiceNumber}</strong> in Höhe von <strong>${invoiceAmount}</strong> als fällig und
  verbindlich zur Zahlung.</p>

  ${invoiceLink ? `
  <p>Rechnungslink / Download:<br>
  <a href="${invoiceLink}" style="color: #2563eb;">${invoiceLink}</a></p>
  ` : ""}

  <div style="margin: 32px 0; display: flex; gap: 12px; flex-wrap: wrap;">
    <a href="${ticketReplyLink}" style="background-color: #dc2626; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
      Ich habe ein Problem
    </a>
  </div>

  <p>Vielen Dank für Ihr Vertrauen und die Zusammenarbeit.</p>

  <p>Mit freundlichen Grüßen,<br>
  <strong>AB MEDIA TEAM</strong></p>

  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0 16px;" />
  <p style="font-size: 12px; color: #6b7280;">
    Diese E-Mail wurde automatisch versendet. Ticket-Nr.: ${ticketId} | Datum: ${todayDate}
  </p>
</body>
</html>`;

    // Send email
    const emailResponse = await resend.emails.send({
      from: "AB Media Team <noreply@empriadental.de>",
      to: [order.contact_email],
      subject: subject,
      html: htmlBody,
    });

    console.log("Service delivered email sent:", emailResponse);

    // Log in client_email_logs
    const { error: logError } = await supabase.from("client_email_logs").insert({
      order_id: orderId,
      sent_to: order.contact_email,
      sent_by: changedBy?.id || null,
      sent_by_name: changedBy?.name || "System",
      company_name: order.company_name,
      order_price: order.price,
      currency: order.currency || "EUR",
      custom_message: `Service Delivered notification sent. Ticket: ${ticketId}`,
    });

    if (logError) {
      console.error("Error logging email:", logError);
    }

    return new Response(
      JSON.stringify({ success: true, emailId: emailResponse?.data?.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-service-delivered-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
