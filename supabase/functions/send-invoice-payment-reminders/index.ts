import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- Language detection from address ---
const detectLanguageFromAddress = (address: string | null | undefined): string => {
  if (!address) return "en";
  const lower = address.toLowerCase();
  const map: [RegExp, string][] = [
    [/deutschland|germany/i, "de"],
    [/nederland|netherlands|holland/i, "nl"],
    [/france|frankreich|français/i, "fr"],
    [/españa|spain|spanien/i, "es"],
    [/danmark|denmark|dänemark/i, "da"],
    [/norge|norway|norwegen/i, "no"],
    [/česko|czech|tschech/i, "cs"],
    [/polska|poland|polen/i, "pl"],
    [/sverige|sweden|schweden/i, "sv"],
  ];
  for (const [regex, lang] of map) {
    if (regex.test(lower)) return lang;
  }
  return "en";
};

// --- Translations for client-facing emails ---
interface ReminderTranslations {
  subjectPrefix: string;
  invoiceLabel: string;
  urgency: [string, string, string]; // [normal, follow-up, urgent]
  greeting: string; // {name} placeholder
  amountDue: string;
  orderDescription: string;
  footer: string;
}

const translations: Record<string, ReminderTranslations> = {
  en: {
    subjectPrefix: "Payment Reminder",
    invoiceLabel: "Invoice",
    urgency: ["Payment Reminder", "Payment Reminder Follow-Up", "Urgent Payment Reminder"],
    greeting: "Dear {name}, this is a friendly reminder that your invoice is still pending payment.",
    amountDue: "Amount Due",
    orderDescription: "Order Description",
    footer: "This is an automated payment reminder from",
  },
  de: {
    subjectPrefix: "Zahlungserinnerung",
    invoiceLabel: "Rechnung",
    urgency: ["Zahlungserinnerung", "Zahlungserinnerung – Folgemahnung", "Dringende Zahlungserinnerung"],
    greeting: "Sehr geehrte/r {name}, wir möchten Sie freundlich daran erinnern, dass Ihre Rechnung noch zur Zahlung aussteht.",
    amountDue: "Offener Betrag",
    orderDescription: "Auftragsbeschreibung",
    footer: "Dies ist eine automatische Zahlungserinnerung von",
  },
  nl: {
    subjectPrefix: "Betalingsherinnering",
    invoiceLabel: "Factuur",
    urgency: ["Betalingsherinnering", "Betalingsherinnering – Opvolging", "Dringende Betalingsherinnering"],
    greeting: "Beste {name}, dit is een vriendelijke herinnering dat uw factuur nog openstaat.",
    amountDue: "Openstaand Bedrag",
    orderDescription: "Bestelbeschrijving",
    footer: "Dit is een automatische betalingsherinnering van",
  },
  fr: {
    subjectPrefix: "Rappel de paiement",
    invoiceLabel: "Facture",
    urgency: ["Rappel de paiement", "Rappel de paiement – Suivi", "Rappel de paiement urgent"],
    greeting: "Cher/Chère {name}, nous vous rappelons aimablement que votre facture est toujours en attente de paiement.",
    amountDue: "Montant dû",
    orderDescription: "Description de la commande",
    footer: "Ceci est un rappel de paiement automatique de",
  },
  es: {
    subjectPrefix: "Recordatorio de pago",
    invoiceLabel: "Factura",
    urgency: ["Recordatorio de pago", "Recordatorio de pago – Seguimiento", "Recordatorio de pago urgente"],
    greeting: "Estimado/a {name}, le recordamos amablemente que su factura aún está pendiente de pago.",
    amountDue: "Importe pendiente",
    orderDescription: "Descripción del pedido",
    footer: "Este es un recordatorio de pago automático de",
  },
  da: {
    subjectPrefix: "Betalingspåmindelse",
    invoiceLabel: "Faktura",
    urgency: ["Betalingspåmindelse", "Betalingspåmindelse – Opfølgning", "Hastende betalingspåmindelse"],
    greeting: "Kære {name}, dette er en venlig påmindelse om, at din faktura stadig afventer betaling.",
    amountDue: "Udestående beløb",
    orderDescription: "Bestillingsbeskrivelse",
    footer: "Dette er en automatisk betalingspåmindelse fra",
  },
  no: {
    subjectPrefix: "Betalingspåminnelse",
    invoiceLabel: "Faktura",
    urgency: ["Betalingspåminnelse", "Betalingspåminnelse – Oppfølging", "Haster – Betalingspåminnelse"],
    greeting: "Kjære {name}, dette er en vennlig påminnelse om at din faktura fortsatt venter på betaling.",
    amountDue: "Utestående beløp",
    orderDescription: "Bestillingsbeskrivelse",
    footer: "Dette er en automatisk betalingspåminnelse fra",
  },
  cs: {
    subjectPrefix: "Upomínka k platbě",
    invoiceLabel: "Faktura",
    urgency: ["Upomínka k platbě", "Upomínka k platbě – připomenutí", "Naléhavá upomínka k platbě"],
    greeting: "Vážený/á {name}, dovolujeme si Vám připomenout, že Vaše faktura stále čeká na úhradu.",
    amountDue: "Dlužná částka",
    orderDescription: "Popis objednávky",
    footer: "Toto je automatická upomínka k platbě od",
  },
  pl: {
    subjectPrefix: "Przypomnienie o płatności",
    invoiceLabel: "Faktura",
    urgency: ["Przypomnienie o płatności", "Przypomnienie o płatności – kontynuacja", "Pilne przypomnienie o płatności"],
    greeting: "Szanowny/a {name}, uprzejmie przypominamy, że Państwa faktura wciąż oczekuje na płatność.",
    amountDue: "Kwota do zapłaty",
    orderDescription: "Opis zamówienia",
    footer: "To jest automatyczne przypomnienie o płatności od",
  },
  sv: {
    subjectPrefix: "Betalningspåminnelse",
    invoiceLabel: "Faktura",
    urgency: ["Betalningspåminnelse", "Betalningspåminnelse – Uppföljning", "Brådskande betalningspåminnelse"],
    greeting: "Bäste {name}, detta är en vänlig påminnelse om att din faktura fortfarande väntar på betalning.",
    amountDue: "Utestående belopp",
    orderDescription: "Orderbeskrivning",
    footer: "Detta är en automatisk betalningspåminnelse från",
  },
};

const getTranslations = (lang: string): ReminderTranslations => translations[lang] || translations.en;

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
  language: string;
}) => {
  const t = getTranslations(data.isClientEmail ? data.language : 'en');
  const initial = (data.clientName || 'C').charAt(0).toUpperCase();
  const urgencyColor = data.reminderNumber >= 3 ? '#dc2626' : data.reminderNumber >= 2 ? '#f59e0b' : '#1a73e8';
  const urgencyIdx = data.reminderNumber >= 3 ? 2 : data.reminderNumber >= 2 ? 1 : 0;
  const urgencyLabel = t.urgency[urgencyIdx];

  const subtitleText = data.isClientEmail
    ? t.greeting.replace('{name}', data.clientName)
    : `Payment reminder #${data.reminderNumber} for invoice ${data.invoiceNumber} — follow up required.`;

  return `<!DOCTYPE html>
<html lang="${data.isClientEmail ? data.language : 'en'}">
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
            ${subtitleText}
          </p>
        </td></tr>

        <!-- Invoice Details Card -->
        <tr><td style="padding:16px 32px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f8f9fa; border-radius:12px; border:1px solid #e8eaed;">
            <tr><td style="padding:20px 24px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr><td colspan="2" style="padding-bottom:12px; border-bottom:1px solid #e8eaed;">
                  <span style="font-family:Roboto,Arial,sans-serif; font-size:16px; font-weight:700; color:#202124;">${t.invoiceLabel} ${data.invoiceNumber}</span>
                </td></tr>
                <tr><td style="padding-top:12px; font-family:Roboto,Arial,sans-serif; font-size:13px; color:#5f6368;">${t.amountDue}</td>
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
              <div style="font-family:Roboto,Arial,sans-serif; font-size:12px; color:#1a73e8; font-weight:700; text-transform:uppercase; margin-bottom:6px;">${t.orderDescription}</div>
              <div style="font-family:Roboto,Arial,sans-serif; font-size:14px; color:#202124;">${data.description}</div>
            </td></tr>
          </table>
        </td></tr>
        ` : ''}

        <!-- Bank Payment Details -->
        <tr><td style="padding:0 32px 16px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f0f7ff; border-radius:12px; border:1px solid #d2e3fc;">
            <tr><td style="padding:20px 24px;">
              <div style="font-family:Roboto,Arial,sans-serif; font-size:16px; font-weight:700; color:#1a73e8; margin-bottom:15px;">🏦 Payment Information</div>
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
                <tr><td colspan="2" style="font-weight:bold; padding:8px 0 4px; color:#202124; font-family:Roboto,Arial,sans-serif; font-size:14px;"><tr><td colspan="2" style="font-weight:bold; padding:8px 0 4px; color:#202124; font-family:Roboto,Arial,sans-serif; font-size:14px;">Belgian Bank Account</td></tr></td></tr>
                <tr><td style="color:#5f6368; padding:3px 0; font-family:Roboto,Arial,sans-serif; font-size:13px; width:80px;">IBAN:</td><td style="color:#202124; font-family:Roboto,Arial,sans-serif; font-size:13px;">BE79967023897833</td></tr>
                <tr><td style="color:#5f6368; padding:3px 0; font-family:Roboto,Arial,sans-serif; font-size:13px;">BIC:</td><td style="color:#202124; font-family:Roboto,Arial,sans-serif; font-size:13px;">TRWIBEB1XXX</td></tr>
                <tr><td style="color:#5f6368; padding:3px 0; font-family:Roboto,Arial,sans-serif; font-size:13px;">BLZ:</td><td style="color:#202124; font-family:Roboto,Arial,sans-serif; font-size:13px;">967</td></tr>
                <tr><td style="color:#5f6368; padding:3px 0; font-family:Roboto,Arial,sans-serif; font-size:13px;">Konto:</td><td style="color:#202124; font-family:Roboto,Arial,sans-serif; font-size:13px;">967023897833</td></tr>
                <tr><td colspan="2" style="padding:10px 0 0;"><hr style="border:none; border-top:1px solid #d2e3fc;"></td></tr>
                <tr><td colspan="2" style="font-weight:bold; padding:8px 0 4px; color:#202124; font-family:Roboto,Arial,sans-serif; font-size:14px;">German Bank Account</td></tr>
                <tr><td style="color:#5f6368; padding:3px 0; font-family:Roboto,Arial,sans-serif; font-size:13px;">IBAN:</td><td style="color:#202124; font-family:Roboto,Arial,sans-serif; font-size:13px;">DE91240703680071572200</td></tr>
                <tr><td style="color:#5f6368; padding:3px 0; font-family:Roboto,Arial,sans-serif; font-size:13px;">BIC:</td><td style="color:#202124; font-family:Roboto,Arial,sans-serif; font-size:13px;">DEUTDE2HP22</td></tr>
                <tr><td style="color:#5f6368; padding:3px 0; font-family:Roboto,Arial,sans-serif; font-size:13px;">Bank:</td><td style="color:#202124; font-family:Roboto,Arial,sans-serif; font-size:13px;">Postbank/DSL Ndl of Deutsche Bank</td></tr>
                <tr><td colspan="2" style="padding:10px 0 0;"><hr style="border:none; border-top:1px solid #d2e3fc;"></td></tr>
                <tr><td colspan="2" style="font-weight:bold; padding:8px 0 4px; color:#202124; font-family:Roboto,Arial,sans-serif; font-size:14px;">UK Bank Account (Wise)</td></tr>
                <tr><td style="color:#5f6368; padding:3px 0; font-family:Roboto,Arial,sans-serif; font-size:13px;">IBAN:</td><td style="color:#202124; font-family:Roboto,Arial,sans-serif; font-size:13px;">GB73 TRWI 2314 7059 8496 33</td></tr>
                <tr><td style="color:#5f6368; padding:3px 0; font-family:Roboto,Arial,sans-serif; font-size:13px;">Sort Code:</td><td style="color:#202124; font-family:Roboto,Arial,sans-serif; font-size:13px;">23-14-70</td></tr>
                <tr><td style="color:#5f6368; padding:3px 0; font-family:Roboto,Arial,sans-serif; font-size:13px;">Account Number:</td><td style="color:#202124; font-family:Roboto,Arial,sans-serif; font-size:13px;">59849633</td></tr>
                <tr><td style="color:#5f6368; padding:3px 0; font-family:Roboto,Arial,sans-serif; font-size:13px;">Address:</td><td style="color:#202124; font-family:Roboto,Arial,sans-serif; font-size:13px;">56 Shoreditch High Street, London</td></tr>
              </table>
            </td></tr>
          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:24px 32px; border-top:1px solid #e8eaed;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr>
            <td style="font-family:Roboto,Arial,sans-serif; font-size:11px; color:#9aa0a6; text-align:center;">
              ${t.footer} <strong>AB Media Team</strong><br>
              ${data.isClientEmail ? `${urgencyLabel}` : `Reminder`} #${data.reminderNumber} • ${new Date().toLocaleDateString('de-DE')}
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
      });

      const t = getTranslations(testLang);
      await resend.emails.send({
        from: "AB Media Team <noreply@abm-team.com>",
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

        if (!freshInvoice || !['sent', 'overdue'].includes(freshInvoice.status)) {
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

        const newReminderCount = (invoice.reminder_count || 0) + 1;
        const amount = formatPrice(invoice.total_amount, invoice.currency);
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
              from: "AB Media Team <noreply@abm-team.com>",
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

        // Update invoice reminder tracking
        const nextReminderAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
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
