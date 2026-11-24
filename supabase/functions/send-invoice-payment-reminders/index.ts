import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";
import { Resend } from "npm:resend@2.0.0";
import { requireReminderCaller } from "../_shared/assistantAuth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- Sending window: weekdays 09:00–17:00 in company local time ---
const COMPANY_TIMEZONE = "Europe/Sarajevo";
const WINDOW_START_HOUR = 9;
const WINDOW_END_HOUR = 17;

const isWithinSendingWindow = (date: Date = new Date()): boolean => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: COMPANY_TIMEZONE,
    weekday: "short",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const weekday = parts.find(p => p.type === "weekday")?.value || "";
  const hour = parseInt(parts.find(p => p.type === "hour")?.value || "0", 10);

  if (["Sat", "Sun"].includes(weekday)) return false;
  return hour >= WINDOW_START_HOUR && hour < WINDOW_END_HOUR;
};

import { detectLanguageFromAddress, getTranslations, formatPrice, buildReminderEmailHtml } from "../_shared/invoiceReminderEmail.ts";

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const denied = await requireReminderCaller(req);
  if (denied) return denied;

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY_ABMEDIA");

    if (!resendApiKey) {
      console.error("RESEND_API_KEY_ABMEDIA is not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resend = new Resend(resendApiKey);

    // --- TEST MODE: send a demo email without touching real data ---
    let body: any = {};
    try { body = await req.json(); } catch { /* no body = normal cron */ }

    if (body?.test_mode) {
      const testEmail = body.test_email || "test@example.com";
      const testLang = body.test_language || "de";
      console.log(`TEST MODE: sending demo reminder to ${testEmail} in '${testLang}'`);

      const demoHtml = buildReminderEmailHtml({
        clientName: "Max Mustermann",
        clientEmail: "max@muster-gmbh.de",
        clientPhone: "+49 30 123456",
        companyAddress: "Musterstraße 12, 10115 Berlin, Deutschland",
        companyName: "Muster GmbH",
        description: "Premium SEO Package – 12 Months",
        invoiceNumber: "INV-2026-TEST",
        amount: formatPrice(1299, "EUR"),
        reminderNumber: 1,
        isClientEmail: true,
        language: testLang,
        isResolved: body.test_resolved === true,
      });

      const t = getTranslations(testLang);
      await resend.emails.send({
        from: "Media Marketing <noreply@mediaamarketing.com>",
        to: [testEmail],
        subject: `💰 ${t.urgency[0]} #1: ${t.invoiceLabel} INV-2026-TEST - ${formatPrice(1299, "EUR")}`,
        html: demoHtml,
      });

      console.log(`TEST MODE: demo email sent to ${testEmail}`);
      return new Response(
        JSON.stringify({ message: "Test email sent", to: testEmail, language: testLang }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    // --- END TEST MODE ---

    console.log("Starting invoice payment reminder check...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date().toISOString();

    // Only send client reminders on weekdays during business hours.
    // Anything due outside the window simply waits for the next allowed run.
    if (!isWithinSendingWindow() && !body?.force) {
      console.log("Outside sending window (weekdays 09:00-17:00 Europe/Sarajevo) - skipping this run");
      return new Response(
        JSON.stringify({ message: "Outside sending window", processed: 0, skipped: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find invoices due for a reminder
    const { data: dueInvoices, error: fetchError } = await supabase
      .from("invoices")
      .select("*, client:clients(*), payments(amount)")
      .in("status", ["sent", "overdue", "partially_paid"])
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
        // Skip invoices where reminders have been manually paused
        if (invoice.reminders_paused) {
          console.log(`Skipping invoice ${invoice.invoice_number} - reminders manually paused`);
          continue;
        }

        // Re-verify invoice status hasn't changed (guards against race conditions with payment processing)
        const { data: freshInvoice } = await supabase
          .from("invoices")
          .select("status, reminders_paused")
          .eq("id", invoice.id)
          .single();

        if (!freshInvoice || !['sent', 'overdue', 'partially_paid'].includes(freshInvoice.status)) {
          console.log(`Skipping invoice ${invoice.invoice_number} - status changed to ${freshInvoice?.status}`);
          continue;
        }

        if (freshInvoice.reminders_paused) {
          console.log(`Skipping invoice ${invoice.invoice_number} - reminders paused (verified)`);
          continue;
        }

        // Get order ID from direct column link, fall back to regex in notes
        let orderId = invoice.order_id;
        if (!orderId) {
          const orderIdMatch = invoice.notes?.match(/Order ID: ([a-f0-9-]+)/);
          orderId = orderIdMatch?.[1] || null;
        }

        let order: any = null;
        let clientEmail: string | null = null;
        let detectedLanguage = "en";

        if (orderId) {
          // Fetch order details
          const { data: orderData, error: orderError } = await supabase
            .from("orders")
            .select("*")
            .eq("id", orderId)
            .single();

          if (orderError || !orderData) {
            console.log(`Skipping invoice ${invoice.invoice_number} - order not found: ${orderId}`);
            continue;
          }

          // Skip reminders for deleted or cancelled orders
          if (orderData.status_deleted || orderData.status_cancelled) {
            console.log(`Skipping invoice ${invoice.invoice_number} - order is ${orderData.status_deleted ? 'deleted' : 'cancelled'}`);
            await supabase.from("invoices").update({ next_reminder_at: null }).eq("id", invoice.id);
            continue;
          }

          // Also skip if order is already marked as invoice paid (self-healing for sync gaps)
          if (orderData.status_invoice_paid) {
            console.log(`Skipping invoice ${invoice.invoice_number} - order is marked as invoice paid, auto-correcting invoice status`);
            await supabase.from("invoices").update({ status: 'paid', next_reminder_at: null }).eq("id", invoice.id);
            continue;
          }

          order = orderData;
          clientEmail = order.contact_email;
          detectedLanguage = detectLanguageFromAddress(order.company_address);
        } else {
          // Monthly invoice (no order_id) — get client info from the invoice's client record
          console.log(`Invoice ${invoice.invoice_number}: no order_id, treating as monthly invoice`);
          clientEmail = invoice.client?.email || null;
          // Try to detect language from client address
          detectedLanguage = detectLanguageFromAddress(invoice.client?.address || null);
        }

        // Respect per-client "automatic reminders" switch
        let clientRecord: any = invoice.client || null;
        if (!clientRecord && clientEmail) {
          const { data: matchedClient } = await supabase
            .from("clients")
            .select("id, auto_reminders_enabled")
            .ilike("email", clientEmail)
            .limit(1)
            .maybeSingle();
          clientRecord = matchedClient || null;
        }

        if (clientRecord && clientRecord.auto_reminders_enabled === false) {
          console.log(`Skipping invoice ${invoice.invoice_number} - client has automatic reminders disabled`);
          await supabase.from("invoices").update({ next_reminder_at: null }).eq("id", invoice.id);
          continue;
        }

        const newReminderCount = (invoice.reminder_count || 0) + 1;

        // Chase the remaining balance, not the original total
        const paidAmount = Array.isArray((invoice as any).payments)
          ? (invoice as any).payments.reduce((sum: number, p: any) => sum + (Number(p?.amount) || 0), 0)
          : 0;
        const outstandingAmount = Math.max(0, Number(invoice.total_amount || 0) - paidAmount);

        if (paidAmount > 0 && outstandingAmount <= 0) {
          console.log(`Skipping invoice ${invoice.invoice_number} - fully covered by recorded payments`);
          await supabase.from("invoices").update({ status: 'paid', next_reminder_at: null }).eq("id", invoice.id);
          continue;
        }

        const amount = formatPrice(outstandingAmount, invoice.currency);
        if (paidAmount > 0) {
          console.log(`Invoice ${invoice.invoice_number}: partially paid, chasing remaining ${amount}`);
        }
        const t = getTranslations(detectedLanguage);
        console.log(`Invoice ${invoice.invoice_number}: detected language '${detectedLanguage}'`);

        const emailData = {
          clientName: order?.contact_name || order?.company_name || invoice.client?.contact_person || invoice.client?.name || 'Client',
          clientEmail: clientEmail || '',
          clientPhone: order?.contact_phone || invoice.client?.phone || '',
          companyAddress: order?.company_address || invoice.client?.address || '',
          companyName: order?.company_name || invoice.client?.name || 'Unknown',
          description: order?.description || invoice.notes || '',
          invoiceNumber: invoice.invoice_number,
          amount,
          reminderNumber: newReminderCount,
          language: detectedLanguage,
          isResolved: order?.status_resolved === true,
        };

        // Send to client if email exists — in the detected language
        // Build CC list from invoice.cc_emails (deduped, lowercased, excluding the primary)
        const primaryLower = (clientEmail || "").trim().toLowerCase();
        const ccList: string[] = Array.isArray(invoice.cc_emails)
          ? Array.from(new Set(
              invoice.cc_emails
                .map((e: string) => (e || "").trim().toLowerCase())
                .filter((e: string) => e && e !== primaryLower)
            ))
          : [];
        let clientEmailSent = false;
        let allRecipientsSent: string[] = [];
        if (clientEmail) {
          try {
            const urgencyIdx = newReminderCount >= 3 ? 2 : newReminderCount >= 2 ? 1 : 0;
            const clientSubject = `💰 ${t.urgency[urgencyIdx]} #${newReminderCount}: ${t.invoiceLabel} ${invoice.invoice_number} - ${amount}`;

            await resend.emails.send({
              from: "Media Marketing <noreply@mediaamarketing.com>",
              to: [clientEmail],
              cc: ccList.length > 0 ? ccList : undefined,
              subject: clientSubject,
              html: buildReminderEmailHtml({ ...emailData, isClientEmail: true }),
            });
            clientEmailSent = true;
            allRecipientsSent = [clientEmail, ...ccList];
            console.log(`Client email sent to ${clientEmail}${ccList.length ? ` (cc: ${ccList.join(", ")})` : ""} for invoice ${invoice.invoice_number} (lang: ${detectedLanguage})`);
            await delay(500);
          } catch (emailErr) {
            console.error(`Failed to send client email to ${clientEmail}:`, emailErr);
          }
        }

        // Team emails intentionally not sent — team monitors reminders inside the app.
        console.log(`Reminder dispatch complete for invoice ${invoice.invoice_number}: client=${clientEmailSent}, cc=${ccList.length}`);

        // Update invoice reminder tracking — use per-invoice interval (default 48h)
        const intervalHours = invoice.reminder_interval_hours || 168;
        const nextReminderAt = new Date(Date.now() + intervalHours * 60 * 60 * 1000).toISOString();
        await supabase.from("invoices").update({
          reminder_count: newReminderCount,
          last_reminder_sent_at: now,
          next_reminder_at: nextReminderAt,
        }).eq("id", invoice.id);

        // Log the reminder (record full recipient list including CCs)
        await supabase.from("invoice_payment_reminders").insert({
          invoice_id: invoice.id,
          order_id: orderId || invoice.id,
          reminder_number: newReminderCount,
          sent_to_client: allRecipientsSent.length > 0 ? allRecipientsSent.join(", ") : (clientEmail || null),
          sent_to_team: false,
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
