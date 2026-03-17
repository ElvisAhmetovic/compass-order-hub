import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
  "johan@team-abmedia.com",
];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const formatPrice = (amount: number, currency: string) => {
  const symbols: Record<string, string> = { EUR: '€', USD: '$', GBP: '£' };
  const symbol = symbols[currency] || currency;
  return `${symbol}${Number(amount).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const buildReminderEmailHtml = (data: {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  companyAddress: string;
  companyName: string;
  description: string;
  invoiceNumber: string;
  amount: string;
  reminderNumber: number;
  isClientEmail: boolean;
}) => {
  const initial = (data.clientName || 'C').charAt(0).toUpperCase();
  const urgencyColor = data.reminderNumber >= 3 ? '#dc2626' : data.reminderNumber >= 2 ? '#f59e0b' : '#1a73e8';
  const urgencyLabel = data.reminderNumber >= 3 ? 'Urgent Payment Reminder' : data.reminderNumber >= 2 ? 'Payment Reminder Follow-Up' : 'Payment Reminder';

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>${urgencyLabel} - AB Media Team</title></head>
<body style="margin:0; padding:0; background-color:#ffffff; font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#ffffff; padding:40px 0;">
    <tr><td align="center">
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="max-width:600px; background-color:#ffffff;">
        <!-- Header -->
        <tr><td style="padding:22px 32px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr>
            <td align="left" style="font-family:Roboto,Arial,sans-serif; font-size:13px; color:${urgencyColor}; font-weight:bold;">${urgencyLabel} #${data.reminderNumber}</td>
            <td align="right" style="font-family:Roboto,Arial,sans-serif; font-size:18px; font-weight:bold; color:#1a73e8;">AB Media Team</td>
          </tr></table>
        </td></tr>

        <!-- Stars -->
        <tr><td style="text-align:center; padding:32px 24px 0px;">
          <div style="font-size:48px; color:#fbbc05; letter-spacing:8px; line-height:1;">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
        </td></tr>

        <!-- Illustration -->
        <tr><td style="text-align:center; padding:8px 24px 0px;">
          <img src="https://www.gstatic.com/gumdrop/files/gmb-migration-transparent-w726-h298-2x.png" width="363" height="auto" border="0" alt="" style="display:inline-block; max-width:363px; width:100%;">
        </td></tr>

        <!-- Title -->
        <tr><td style="text-align:center; padding:20px 32px 8px;">
          <h1 style="font-family:Roboto,Arial,sans-serif; font-size:22px; font-weight:700; color:#202124; margin:0;">
            💰 ${urgencyLabel}
          </h1>
          <p style="font-family:Roboto,Arial,sans-serif; font-size:14px; color:#5f6368; margin:8px 0 0;">
            ${data.isClientEmail 
              ? `Dear ${data.clientName}, this is a friendly reminder that your invoice is still pending payment.`
              : `Payment reminder #${data.reminderNumber} for invoice ${data.invoiceNumber} — follow up required.`
            }
          </p>
        </td></tr>

        <!-- Invoice Details Card -->
        <tr><td style="padding:16px 32px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f8f9fa; border-radius:12px; border:1px solid #e8eaed;">
            <tr><td style="padding:20px 24px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr><td colspan="2" style="padding-bottom:12px; border-bottom:1px solid #e8eaed;">
                  <span style="font-family:Roboto,Arial,sans-serif; font-size:16px; font-weight:700; color:#202124;">Invoice ${data.invoiceNumber}</span>
                </td></tr>
                <tr><td style="padding-top:12px; font-family:Roboto,Arial,sans-serif; font-size:13px; color:#5f6368;">Amount Due</td>
                    <td style="padding-top:12px; font-family:Roboto,Arial,sans-serif; font-size:16px; font-weight:700; color:${urgencyColor}; text-align:right;">${data.amount}</td></tr>
              </table>
            </td></tr>
          </table>
        </td></tr>

        <!-- Client Details Card -->
        <tr><td style="padding:0 32px 16px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f8f9fa; border-radius:12px; border:1px solid #e8eaed;">
            <tr><td style="padding:20px 24px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td width="44" valign="top">
                    <div style="width:40px; height:40px; border-radius:50%; background-color:#1a73e8; color:#ffffff; font-family:Roboto,Arial,sans-serif; font-size:18px; font-weight:700; text-align:center; line-height:40px;">${initial}</div>
                  </td>
                  <td style="padding-left:12px; vertical-align:top;">
                    <div style="font-family:Roboto,Arial,sans-serif; font-size:15px; font-weight:700; color:#202124;">${data.companyName}</div>
                    <div style="font-family:Roboto,Arial,sans-serif; font-size:13px; color:#5f6368; margin-top:2px;">${data.clientName}</div>
                  </td>
                </tr>
                ${data.clientEmail ? `<tr><td colspan="2" style="padding-top:10px;"><div style="font-family:Roboto,Arial,sans-serif; font-size:13px; color:#5f6368;">📧 ${data.clientEmail}</div></td></tr>` : ''}
                ${data.clientPhone ? `<tr><td colspan="2" style="padding-top:4px;"><div style="font-family:Roboto,Arial,sans-serif; font-size:13px; color:#5f6368;">📱 ${data.clientPhone}</div></td></tr>` : ''}
                ${data.companyAddress ? `<tr><td colspan="2" style="padding-top:4px;"><div style="font-family:Roboto,Arial,sans-serif; font-size:13px; color:#5f6368;">📍 ${data.companyAddress}</div></td></tr>` : ''}
              </table>
            </td></tr>
          </table>
        </td></tr>

        <!-- Order Description -->
        ${data.description ? `
        <tr><td style="padding:0 32px 16px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#e8f0fe; border-radius:12px; border:1px solid #d2e3fc;">
            <tr><td style="padding:16px 24px;">
              <div style="font-family:Roboto,Arial,sans-serif; font-size:12px; color:#1a73e8; font-weight:700; text-transform:uppercase; margin-bottom:6px;">Order Description</div>
              <div style="font-family:Roboto,Arial,sans-serif; font-size:14px; color:#202124;">${data.description}</div>
            </td></tr>
          </table>
        </td></tr>
        ` : ''}

        <!-- Footer -->
        <tr><td style="padding:24px 32px; border-top:1px solid #e8eaed;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr>
            <td style="font-family:Roboto,Arial,sans-serif; font-size:11px; color:#9aa0a6; text-align:center;">
              This is an automated payment reminder from <strong>AB Media Team</strong><br>
              Reminder #${data.reminderNumber} • ${new Date().toLocaleDateString('de-DE')}
            </td>
          </tr></table>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting invoice payment reminder check...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY_ABMEDIA");

    if (!resendApiKey) {
      console.error("RESEND_API_KEY_ABMEDIA is not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(resendApiKey);

    const now = new Date().toISOString();

    // Find invoices due for a reminder
    const { data: dueInvoices, error: fetchError } = await supabase
      .from("invoices")
      .select("*, client:clients(*)")
      .in("status", ["sent", "overdue"])
      .not("next_reminder_at", "is", null)
      .lte("next_reminder_at", now);

    if (fetchError) {
      console.error("Error fetching due invoices:", fetchError);
      throw fetchError;
    }

    console.log(`Found ${dueInvoices?.length || 0} invoices due for reminders`);

    if (!dueInvoices || dueInvoices.length === 0) {
      return new Response(
        JSON.stringify({ message: "No due invoice reminders", processed: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let processedCount = 0;
    let errorCount = 0;

    for (const invoice of dueInvoices) {
      try {
        // Extract order ID from notes
        const orderIdMatch = invoice.notes?.match(/Order ID: ([a-f0-9-]+)/);
        if (!orderIdMatch) {
          console.log(`Skipping invoice ${invoice.invoice_number} - no linked order ID in notes`);
          // Still schedule next reminder
          await supabase.from("invoices").update({
            next_reminder_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          }).eq("id", invoice.id);
          continue;
        }

        const orderId = orderIdMatch[1];

        // Fetch order details
        const { data: order, error: orderError } = await supabase
          .from("orders")
          .select("*")
          .eq("id", orderId)
          .single();

        if (orderError || !order) {
          console.log(`Skipping invoice ${invoice.invoice_number} - order not found: ${orderId}`);
          continue;
        }

        const newReminderCount = (invoice.reminder_count || 0) + 1;
        const clientEmail = order.contact_email;
        const amount = formatPrice(invoice.total_amount, invoice.currency);

        const emailData = {
          clientName: order.contact_name || order.company_name,
          clientEmail: order.contact_email || '',
          clientPhone: order.contact_phone || '',
          companyAddress: order.company_address || '',
          companyName: order.company_name,
          description: order.description || '',
          invoiceNumber: invoice.invoice_number,
          amount,
          reminderNumber: newReminderCount,
        };

        // Send to client if email exists
        let clientEmailSent = false;
        if (clientEmail) {
          try {
            await resend.emails.send({
              from: "AB Media Team <noreply@abm-team.com>",
              to: [clientEmail],
              subject: `💰 Payment Reminder #${newReminderCount}: Invoice ${invoice.invoice_number} - ${amount}`,
              html: buildReminderEmailHtml({ ...emailData, isClientEmail: true }),
            });
            clientEmailSent = true;
            console.log(`Client email sent to ${clientEmail} for invoice ${invoice.invoice_number}`);
            await delay(500);
          } catch (emailErr) {
            console.error(`Failed to send client email to ${clientEmail}:`, emailErr);
          }
        }

        // Send to team members
        let teamEmailsSent = 0;
        for (const email of TEAM_EMAILS) {
          try {
            await resend.emails.send({
              from: "AB Media Team <noreply@abm-team.com>",
              to: [email],
              subject: `💰 Payment Reminder #${newReminderCount}: ${order.company_name} - Invoice ${invoice.invoice_number} - ${amount}`,
              html: buildReminderEmailHtml({ ...emailData, isClientEmail: false }),
            });
            teamEmailsSent++;
            if (teamEmailsSent < TEAM_EMAILS.length) await delay(500);
          } catch (emailErr) {
            console.error(`Failed to send team email to ${email}:`, emailErr);
          }
        }

        console.log(`Sent ${teamEmailsSent}/${TEAM_EMAILS.length} team emails + client=${clientEmailSent} for invoice ${invoice.invoice_number}`);

        // Update invoice reminder tracking
        const nextReminderAt = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
        await supabase.from("invoices").update({
          reminder_count: newReminderCount,
          last_reminder_sent_at: now,
          next_reminder_at: nextReminderAt,
        }).eq("id", invoice.id);

        // Log the reminder
        await supabase.from("invoice_payment_reminders").insert({
          invoice_id: invoice.id,
          order_id: orderId,
          reminder_number: newReminderCount,
          sent_to_client: clientEmail || null,
          sent_to_team: true,
        });

        processedCount++;
      } catch (invoiceError) {
        console.error(`Error processing invoice ${invoice.id}:`, invoiceError);
        errorCount++;
      }
    }

    console.log(`Processed ${processedCount} invoice reminders, ${errorCount} errors`);

    return new Response(
      JSON.stringify({ message: "Invoice payment reminders processed", processed: processedCount, errors: errorCount }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-invoice-payment-reminders:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
