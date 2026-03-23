import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY_ABMEDIA");

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

const germanMonths = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];

// Company info (matches frontend defaults)
const COMPANY = {
  name: "AB MEDIA TEAM",
  contactPerson: "Andreas Berger",
  street: "Weseler Str.73",
  postal: "47169",
  city: "Duisburg",
  country: "Germany",
  phone: "+4920370907262",
  fax: "+49 203 70 90 73 53",
  email: "kontakt.abmedia@gmail.com",
  website: "www.abmedia-team.com",
  registrationNumber: "15748871",
  vatId: "DE123418679",
  taxNumber: "13426 27369",
  director: "Andreas Berger",
};

const BANK_ACCOUNTS = [
  { label: "Belgian Bank Account", iban: "BE79967023897833", bic: "TRWIBEB1XXX", blz: "967", account: "967023897833" },
  { label: "German Bank Account", iban: "DE91240703680071572200", bic: "DEUTDE2HP22", bank: "Postbank/DSL Ndl of Deutsche Bank" },
];

function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: currency || "EUR" }).format(amount);
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
}

// ── Find or create client ──────────────────────────────────────────
async function findOrCreateClient(supabase: any, contract: any): Promise<string> {
  const { data: existing } = await supabase
    .from("clients")
    .select("id")
    .eq("email", contract.client_email)
    .maybeSingle();

  if (existing) return existing.id;

  const { data: newClient, error } = await supabase
    .from("clients")
    .insert({
      name: contract.client_name,
      email: contract.client_email,
      address: contract.company_address || null,
      phone: contract.contact_phone || null,
    })
    .select("id")
    .single();

  if (error) throw new Error(`Failed to create client: ${error.message}`);
  return newClient.id;
}

// ── Create invoice + line item ─────────────────────────────────────
async function createInvoice(
  supabase: any,
  clientId: string,
  contract: any,
  monthLabel: string,
  dueDate: string,
): Promise<{ invoiceId: string; invoiceNumber: string; issueDate: string }> {
  // Generate invoice number
  const { data: invoiceNumber, error: rpcErr } = await supabase.rpc("generate_invoice_number", { prefix_param: "INV" });
  if (rpcErr) throw new Error(`Failed to generate invoice number: ${rpcErr.message}`);

  const totalAmount = contract.monthly_amount;
  const netAmount = totalAmount;
  const vatAmount = 0;
  const issueDate = new Date().toISOString().split("T")[0];

  // We need a user_id for the invoice — use created_by from contract, or fallback
  const userId = contract.created_by || "00000000-0000-0000-0000-000000000000";

  const { data: invoice, error: invErr } = await supabase
    .from("invoices")
    .insert({
      invoice_number: invoiceNumber,
      client_id: clientId,
      issue_date: issueDate,
      due_date: dueDate,
      total_amount: totalAmount,
      net_amount: netAmount,
      vat_amount: vatAmount,
      currency: contract.currency || "EUR",
      status: "sent",
      user_id: userId,
      notes: `Automatisch generierte Rechnung für ${monthLabel}`,
      payment_terms: "Zahlbar innerhalb von 3 Tagen",
    })
    .select("id")
    .single();

  if (invErr) throw new Error(`Failed to create invoice: ${invErr.message}`);

  // Create line item
  const description = contract.description
    ? `${contract.description} – ${monthLabel}`
    : `Monatliche Dienstleistung – ${monthLabel}`;

  await supabase.from("invoice_line_items").insert({
    invoice_id: invoice.id,
    item_description: description,
    quantity: 1,
    unit: "Monat",
    unit_price: netAmount,
    vat_rate: 0,
    discount_rate: 0,
    line_total: totalAmount,
  });

  return { invoiceId: invoice.id, invoiceNumber, issueDate };
}

// ── Generate PDF with jsPDF ────────────────────────────────────────
function generateInvoicePDF(
  invoiceNumber: string,
  issueDate: string,
  dueDate: string,
  clientName: string,
  clientAddress: string | null,
  clientEmail: string,
  description: string,
  netAmount: number,
  vatAmount: number,
  totalAmount: number,
  currency: string,
): Uint8Array {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = 210;
  const marginLeft = 20;
  const marginRight = 20;
  const contentWidth = pageWidth - marginLeft - marginRight;
  let y = 20;

  // ── Header ──
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("AB MEDIA TEAM", marginLeft, y);
  y += 8;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`${COMPANY.street}, ${COMPANY.postal} ${COMPANY.city}, ${COMPANY.country}`, marginLeft, y);
  y += 5;
  doc.text(`Tel: ${COMPANY.phone} | E-Mail: ${COMPANY.email}`, marginLeft, y);
  y += 5;
  doc.text(`USt-IdNr: ${COMPANY.vatId} | Steuernummer: ${COMPANY.taxNumber}`, marginLeft, y);
  y += 5;
  doc.text(`Geschäftsführer: ${COMPANY.director} | Handelsregisternr: ${COMPANY.registrationNumber}`, marginLeft, y);
  y += 3;

  // Separator line
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(marginLeft, y, pageWidth - marginRight, y);
  y += 10;

  // ── Client info ──
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Rechnungsempfänger:", marginLeft, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.text(clientName, marginLeft, y);
  y += 5;
  if (clientAddress) {
    doc.text(clientAddress, marginLeft, y);
    y += 5;
  }
  doc.text(clientEmail, marginLeft, y);
  y += 12;

  // ── Invoice details (right-aligned block) ──
  const detailsX = pageWidth - marginRight;
  const detailsY = y - 22; // align with client block
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(`Rechnungsnummer: ${invoiceNumber}`, detailsX, detailsY, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.text(`Rechnungsdatum: ${formatDate(issueDate)}`, detailsX, detailsY + 6, { align: "right" });
  doc.text(`Fälligkeitsdatum: ${formatDate(dueDate)}`, detailsX, detailsY + 12, { align: "right" });

  // ── Title ──
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("RECHNUNG", marginLeft, y);
  y += 10;

  // ── Line items table ──
  const colWidths = [90, 20, 30, 30];
  const headers = ["Beschreibung", "Menge", "Einzelpreis", "Gesamt"];

  // Table header
  doc.setFillColor(41, 65, 122);
  doc.rect(marginLeft, y - 5, contentWidth, 8, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  let colX = marginLeft + 2;
  headers.forEach((h, i) => {
    doc.text(h, colX, y);
    colX += colWidths[i];
  });
  doc.setTextColor(0, 0, 0);
  y += 6;

  // Table row
  doc.setFont("helvetica", "normal");
  colX = marginLeft + 2;
  const fp = (v: number) => formatPrice(v, currency);
  const rowData = [description, "1", fp(netAmount), fp(netAmount)];
  rowData.forEach((val, i) => {
    doc.text(val, colX, y);
    colX += colWidths[i];
  });
  y += 10;

  // Separator
  doc.setDrawColor(200, 200, 200);
  doc.line(marginLeft, y, pageWidth - marginRight, y);
  y += 8;

  // ── Totals ──
  const totalsX = pageWidth - marginRight - 60;
  doc.setFontSize(10);
  doc.text("Nettobetrag:", totalsX, y);
  doc.text(fp(netAmount), pageWidth - marginRight, y, { align: "right" });
  y += 6;
  doc.text("MwSt.:", totalsX, y);
  doc.text(fp(vatAmount), pageWidth - marginRight, y, { align: "right" });
  y += 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Gesamtbetrag:", totalsX, y);
  doc.text(fp(totalAmount), pageWidth - marginRight, y, { align: "right" });
  y += 15;

  // ── Payment terms ──
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(
    "Wir bitten darum, dass unsere in Rechnung gestellten Leistungen innerhalb von 3 Tagen",
    marginLeft, y,
  );
  y += 5;
  doc.text(
    "gutgeschrieben/überwiesen werden. Alle Steuern und Sozialabgaben werden von uns bei den Behörden angemeldet und abgeführt.",
    marginLeft, y,
  );
  y += 12;

  // ── Bank details ──
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Bankverbindungen:", marginLeft, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  for (const acc of BANK_ACCOUNTS) {
    doc.setFont("helvetica", "bold");
    doc.text(acc.label, marginLeft, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.text(`IBAN: ${acc.iban}`, marginLeft + 5, y);
    y += 5;
    doc.text(`BIC: ${acc.bic}`, marginLeft + 5, y);
    y += 5;
    if (acc.bank) {
      doc.text(`Bank: ${acc.bank}`, marginLeft + 5, y);
      y += 5;
    }
    if (acc.blz) {
      doc.text(`BLZ: ${acc.blz} | Konto: ${acc.account}`, marginLeft + 5, y);
      y += 5;
    }
    y += 3;
  }

  // Return raw bytes
  return doc.output("arraybuffer") as unknown as Uint8Array;
}

// ── Send email with PDF attachment ─────────────────────────────────
async function sendInvoiceEmail(
  to: string,
  clientName: string,
  monthLabel: string,
  invoiceNumber: string,
  totalAmount: number,
  currency: string,
  pdfBytes: Uint8Array,
): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY_ABMEDIA not configured");
    return false;
  }
  const formattedPrice = formatPrice(totalAmount, currency);
  const base64Pdf = btoa(String.fromCharCode(...new Uint8Array(pdfBytes)));

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #1a1a1a;">Rechnung ${invoiceNumber} – ${monthLabel}</h2>
      <p>Hallo ${clientName},</p>
      <p>anbei erhalten Sie Ihre Rechnung für <strong>${monthLabel}</strong>.</p>
      <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #666;">Rechnungsnummer:</td><td style="padding: 8px 0; font-weight: bold;">${invoiceNumber}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Zeitraum:</td><td style="padding: 8px 0; font-weight: bold;">${monthLabel}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Betrag:</td><td style="padding: 8px 0; font-weight: bold; font-size: 18px; color: #2563eb;">${formattedPrice}</td></tr>
        </table>
      </div>
      <p>Die Rechnung finden Sie als PDF im Anhang.</p>
      <p>Bitte veranlassen Sie die Zahlung innerhalb von 3 Tagen.</p>
      <p>Bei Fragen stehen wir Ihnen gerne zur Verfügung.</p>
      <br/><p>Mit freundlichen Grüßen,<br/><strong>AB Media Team</strong></p>
    </div>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: "Thomas Klein <noreply@abm-team.com>",
        to: [to],
        subject: `Rechnung ${invoiceNumber} – ${monthLabel} – ${formattedPrice}`,
        html,
        attachments: [{ filename: `${invoiceNumber}.pdf`, content: base64Pdf }],
      }),
    });
    if (!res.ok) {
      console.error("Resend error:", await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error("Email send error:", err);
    return false;
  }
}

// ── Send team notifications in parallel ────────────────────────────
async function sendTeamNotifications(
  clientName: string,
  monthLabel: string,
  amount: number,
  currency: string,
  invoiceNumber: string,
): Promise<number> {
  const formattedPrice = formatPrice(amount, currency);
  const subject = `Monatliche Rechnung gesendet – ${clientName} – ${monthLabel} – ${invoiceNumber}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #1a1a1a;">Monatliche Rechnung automatisch versendet</h2>
      <p>Folgende Rechnung wurde automatisch erstellt und an den Kunden gesendet:</p>
      <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #666;">Kunde:</td><td style="padding: 8px 0; font-weight: bold;">${clientName}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Rechnungsnr.:</td><td style="padding: 8px 0; font-weight: bold;">${invoiceNumber}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Zeitraum:</td><td style="padding: 8px 0; font-weight: bold;">${monthLabel}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Betrag:</td><td style="padding: 8px 0; font-weight: bold; font-size: 18px; color: #2563eb;">${formattedPrice}</td></tr>
        </table>
      </div>
      <p style="color: #666; font-size: 14px;">Dies ist eine automatische Benachrichtigung des Monatspakete-Systems.</p>
    </div>`;

  // Send in batches of 2 with 1s delay to respect Resend's 2 req/sec rate limit
  let successCount = 0;
  for (let i = 0; i < TEAM_EMAILS.length; i += 2) {
    const batch = TEAM_EMAILS.slice(i, i + 2);
    const results = await Promise.allSettled(
      batch.map((email) =>
        fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
          body: JSON.stringify({
            from: "Thomas Klein <noreply@abm-team.com>",
            to: [email],
            subject,
            html,
          }),
        })
          .then(async (res) => {
            if (!res.ok) console.error(`Failed to notify ${email}:`, await res.text());
            return res.ok;
          })
          .catch((e) => {
            console.error(`Error notifying ${email}:`, e);
            return false;
          })
      )
    );
    successCount += results.filter((r) => r.status === "fulfilled" && r.value === true).length;
    // Wait 1 second between batches to avoid rate limiting
    if (i + 2 < TEAM_EMAILS.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return successCount;
}

// ── Create in-app notifications ────────────────────────────────────
async function createTeamNotifications(
  supabase: any,
  clientName: string,
  monthLabel: string,
  amount: number,
  currency: string,
  invoiceNumber: string,
) {
  const formattedPrice = formatPrice(amount, currency);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id")
    .neq("role", "client");

  if (!profiles || profiles.length === 0) return;

  const notifications = profiles.map((p: any) => ({
    user_id: p.id,
    title: "Monatliche Rechnung gesendet",
    message: `Rechnung ${invoiceNumber} an ${clientName} für ${monthLabel} gesendet — ${formattedPrice}`,
    type: "payment_reminder",
  }));

  await supabase.from("notifications").insert(notifications);
}

// ── Main handler ───────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const monthLabel = `${germanMonths[currentMonth]} ${currentYear}`;

    console.log(`Processing monthly installments for ${monthLabel}`);

    const { data: contracts, error: contractsError } = await supabase
      .from("monthly_contracts")
      .select("*")
      .eq("status", "active");

    if (contractsError) throw new Error(`Error fetching contracts: ${contractsError.message}`);

    if (!contracts || contracts.length === 0) {
      console.log("No active contracts found");
      return new Response(JSON.stringify({ message: "No active contracts" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let processed = 0;
    let emailsSent = 0;
    let teamEmailsSent = 0;
    let invoicesCreated = 0;

    for (const contract of contracts) {
      try {
        // Check if installment already exists for this month
        const { data: existing } = await supabase
          .from("monthly_installments")
          .select("id, email_sent, invoice_id")
          .eq("contract_id", contract.id)
          .eq("month_label", monthLabel)
          .maybeSingle();

        if (existing) {
          // Installment exists — check if we still need to send the email
          if (!existing.email_sent) {
            // Ensure invoice exists
            let invoiceNumber = "";
            let invoiceId = existing.invoice_id;
            if (!invoiceId) {
              const clientId = await findOrCreateClient(supabase, contract);
              const dueDate = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-15`;
              const inv = await createInvoice(supabase, clientId, contract, monthLabel, dueDate);
              invoiceId = inv.invoiceId;
              invoiceNumber = inv.invoiceNumber;
              invoicesCreated++;
              await supabase.from("monthly_installments").update({ invoice_id: invoiceId }).eq("id", existing.id);
            } else {
              // Fetch existing invoice number
              const { data: invData } = await supabase.from("invoices").select("invoice_number").eq("id", invoiceId).single();
              invoiceNumber = invData?.invoice_number || "N/A";
            }

            const totalAmount = contract.monthly_amount;
            const netAmount = Math.round((totalAmount / 1.19) * 100) / 100;
            const vatAmount = Math.round((totalAmount - netAmount) * 100) / 100;
            const description = contract.description ? `${contract.description} – ${monthLabel}` : `Monatliche Dienstleistung – ${monthLabel}`;
            const dueDate = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-15`;

            const pdfBytes = generateInvoicePDF(
              invoiceNumber, new Date().toISOString().split("T")[0], dueDate,
              contract.client_name, contract.company_address, contract.client_email,
              description, netAmount, vatAmount, totalAmount, contract.currency || "EUR",
            );

            const sent = await sendInvoiceEmail(
              contract.client_email, contract.client_name, monthLabel,
              invoiceNumber, totalAmount, contract.currency || "EUR", pdfBytes,
            );
            if (sent) {
              await supabase.from("monthly_installments")
                .update({ email_sent: true, email_sent_at: new Date().toISOString() })
                .eq("id", existing.id);
              emailsSent++;

              const teamSent = await sendTeamNotifications(contract.client_name, monthLabel, totalAmount, contract.currency || "EUR", invoiceNumber);
              teamEmailsSent += teamSent;
              await createTeamNotifications(supabase, contract.client_name, monthLabel, totalAmount, contract.currency || "EUR", invoiceNumber);
            }
          }
          continue;
        }

        // ── New installment ──
        const startDate = new Date(contract.start_date);
        const monthNumber = (currentYear - startDate.getFullYear()) * 12 + (currentMonth - startDate.getMonth()) + 1;

        if (monthNumber < 1 || monthNumber > contract.duration_months) {
          if (monthNumber > contract.duration_months) {
            await supabase.from("monthly_contracts").update({ status: "completed" }).eq("id", contract.id);
          }
          continue;
        }

        // Find or create client + invoice
        const clientId = await findOrCreateClient(supabase, contract);
        const dueDate = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-15`;
        const { invoiceId, invoiceNumber, issueDate } = await createInvoice(supabase, clientId, contract, monthLabel, dueDate);
        invoicesCreated++;

        // Create installment row
        const { data: newInstallment, error: insertError } = await supabase
          .from("monthly_installments")
          .insert({
            contract_id: contract.id,
            month_label: monthLabel,
            month_number: monthNumber,
            due_date: `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-01`,
            amount: contract.monthly_amount,
            currency: contract.currency,
            payment_status: "unpaid",
            client_name: contract.client_name,
            client_email: contract.client_email,
            website: contract.website,
            invoice_id: invoiceId,
          })
          .select()
          .single();

        if (insertError) {
          console.error(`Error creating installment for contract ${contract.id}:`, insertError);
          continue;
        }
        processed++;

        // Generate PDF and send
        const totalAmount = contract.monthly_amount;
        const netAmount = Math.round((totalAmount / 1.19) * 100) / 100;
        const vatAmount = Math.round((totalAmount - netAmount) * 100) / 100;
        const description = contract.description ? `${contract.description} – ${monthLabel}` : `Monatliche Dienstleistung – ${monthLabel}`;

        const pdfBytes = generateInvoicePDF(
          invoiceNumber, issueDate, dueDate,
          contract.client_name, contract.company_address, contract.client_email,
          description, netAmount, vatAmount, totalAmount, contract.currency || "EUR",
        );

        const sent = await sendInvoiceEmail(
          contract.client_email, contract.client_name, monthLabel,
          invoiceNumber, totalAmount, contract.currency || "EUR", pdfBytes,
        );

        if (sent && newInstallment) {
          await supabase.from("monthly_installments")
            .update({ email_sent: true, email_sent_at: new Date().toISOString() })
            .eq("id", newInstallment.id);
          emailsSent++;

          const teamSent = await sendTeamNotifications(contract.client_name, monthLabel, totalAmount, contract.currency || "EUR", invoiceNumber);
          teamEmailsSent += teamSent;
          await createTeamNotifications(supabase, contract.client_name, monthLabel, totalAmount, contract.currency || "EUR", invoiceNumber);
        }
      } catch (contractErr) {
        console.error(`Error processing contract ${contract.id} (${contract.client_name}):`, contractErr);
        continue;
      }
    }

    console.log(`Processed ${processed} installments, created ${invoicesCreated} invoices, sent ${emailsSent} client emails, ${teamEmailsSent} team emails`);

    return new Response(
      JSON.stringify({ success: true, processed, invoicesCreated, emailsSent, teamEmailsSent, month: monthLabel }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error in generate-monthly-installments:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
