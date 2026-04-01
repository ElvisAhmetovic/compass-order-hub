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

// ── Language detection from company address ────────────────────────
type Lang = "en" | "de" | "nl" | "fr" | "es" | "da" | "no" | "cs" | "pl" | "sv";

function detectLanguageFromAddress(address: string | null): Lang {
  if (!address) return "en";
  const lower = address.toLowerCase();
  const map: [RegExp, Lang][] = [
    [/deutschland|germany|berlin|münchen|munich|hamburg|köln|frankfurt|düsseldorf|duisburg|stuttgart/, "de"],
    [/nederland|netherlands|amsterdam|rotterdam|den haag|utrecht/, "nl"],
    [/france|frankreich|paris|lyon|marseille/, "fr"],
    [/españa|spain|spanien|madrid|barcelona/, "es"],
    [/danmark|denmark|dänemark|copenhagen|københavn/, "da"],
    [/norge|norway|norwegen|oslo|bergen/, "no"],
    [/česk|czech|tschech|prague|prag|praha/, "cs"],
    [/polska|poland|polen|warsaw|warschau|warszawa|kraków/, "pl"],
    [/sverige|sweden|schweden|stockholm|göteborg|malmö/, "sv"],
    [/österreich|austria|wien|vienna|graz|salzburg/, "de"],
    [/schweiz|switzerland|zürich|zurich|bern|basel/, "de"],
  ];
  for (const [regex, lang] of map) {
    if (regex.test(lower)) return lang;
  }
  return "en";
}

// ── Localized month names ──────────────────────────────────────────
const MONTH_NAMES: Record<Lang, string[]> = {
  en: ["January","February","March","April","May","June","July","August","September","October","November","December"],
  de: ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"],
  nl: ["Januari","Februari","Maart","April","Mei","Juni","Juli","Augustus","September","Oktober","November","December"],
  fr: ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"],
  es: ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"],
  da: ["Januar","Februar","Marts","April","Maj","Juni","Juli","August","September","Oktober","November","December"],
  no: ["Januar","Februar","Mars","April","Mai","Juni","Juli","August","September","Oktober","November","Desember"],
  cs: ["Leden","Únor","Březen","Duben","Květen","Červen","Červenec","Srpen","Září","Říjen","Listopad","Prosinec"],
  pl: ["Styczeń","Luty","Marzec","Kwiecień","Maj","Czerwiec","Lipiec","Sierpień","Wrzesień","Październik","Listopad","Grudzień"],
  sv: ["Januari","Februari","Mars","April","Maj","Juni","Juli","Augusti","September","Oktober","November","December"],
};

// ── PDF label translations ─────────────────────────────────────────
const PDF_LABELS: Record<Lang, {
  invoiceRecipient: string; invoiceNumber: string; invoiceDate: string; dueDate: string;
  invoiceTitle: string; description: string; quantity: string; unitPrice: string; total: string;
  netAmount: string; vat: string; totalAmount: string; paymentTermsTitle: string;
  paymentTermsLine1: string; paymentTermsLine2: string; bankDetails: string;
  unit: string; vatId: string; taxNumber: string; director: string; regNumber: string;
}> = {
  en: {
    invoiceRecipient: "Invoice Recipient:", invoiceNumber: "Invoice Number:", invoiceDate: "Invoice Date:", dueDate: "Due Date:",
    invoiceTitle: "INVOICE", description: "Description", quantity: "Qty", unitPrice: "Unit Price", total: "Total",
    netAmount: "Net Amount:", vat: "VAT:", totalAmount: "Total Amount:",
    paymentTermsTitle: "Payment Terms",
    paymentTermsLine1: "We kindly request that the invoiced amount be credited/transferred within 3 days.",
    paymentTermsLine2: "All taxes and social contributions are reported and paid by us to the authorities.",
    bankDetails: "Bank Details:", unit: "Month",
    vatId: "VAT ID:", taxNumber: "Tax Number:", director: "Director:", regNumber: "Reg. No.:",
  },
  de: {
    invoiceRecipient: "Rechnungsempfänger:", invoiceNumber: "Rechnungsnummer:", invoiceDate: "Rechnungsdatum:", dueDate: "Fälligkeitsdatum:",
    invoiceTitle: "RECHNUNG", description: "Beschreibung", quantity: "Menge", unitPrice: "Einzelpreis", total: "Gesamt",
    netAmount: "Nettobetrag:", vat: "MwSt.:", totalAmount: "Gesamtbetrag:",
    paymentTermsTitle: "Zahlungsbedingungen",
    paymentTermsLine1: "Wir bitten darum, dass unsere in Rechnung gestellten Leistungen innerhalb von 3 Tagen",
    paymentTermsLine2: "gutgeschrieben/überwiesen werden. Alle Steuern und Sozialabgaben werden von uns bei den Behörden angemeldet und abgeführt.",
    bankDetails: "Bankverbindungen:", unit: "Monat",
    vatId: "USt-IdNr:", taxNumber: "Steuernummer:", director: "Geschäftsführer:", regNumber: "Handelsregisternr:",
  },
  nl: {
    invoiceRecipient: "Factuurontvanger:", invoiceNumber: "Factuurnummer:", invoiceDate: "Factuurdatum:", dueDate: "Vervaldatum:",
    invoiceTitle: "FACTUUR", description: "Omschrijving", quantity: "Aantal", unitPrice: "Prijs per eenheid", total: "Totaal",
    netAmount: "Nettobedrag:", vat: "BTW:", totalAmount: "Totaalbedrag:",
    paymentTermsTitle: "Betalingsvoorwaarden",
    paymentTermsLine1: "Wij verzoeken u vriendelijk het gefactureerde bedrag binnen 3 dagen over te maken.",
    paymentTermsLine2: "Alle belastingen en sociale premies worden door ons bij de autoriteiten aangegeven en afgedragen.",
    bankDetails: "Bankgegevens:", unit: "Maand",
    vatId: "BTW-nr:", taxNumber: "Belastingnummer:", director: "Directeur:", regNumber: "KvK-nr:",
  },
  fr: {
    invoiceRecipient: "Destinataire de la facture:", invoiceNumber: "Numéro de facture:", invoiceDate: "Date de facture:", dueDate: "Date d'échéance:",
    invoiceTitle: "FACTURE", description: "Description", quantity: "Quantité", unitPrice: "Prix unitaire", total: "Total",
    netAmount: "Montant net:", vat: "TVA:", totalAmount: "Montant total:",
    paymentTermsTitle: "Conditions de paiement",
    paymentTermsLine1: "Nous vous prions de bien vouloir régler le montant facturé dans un délai de 3 jours.",
    paymentTermsLine2: "Toutes les taxes et cotisations sociales sont déclarées et versées par nos soins aux autorités.",
    bankDetails: "Coordonnées bancaires:", unit: "Mois",
    vatId: "N° TVA:", taxNumber: "N° fiscal:", director: "Directeur:", regNumber: "N° registre:",
  },
  es: {
    invoiceRecipient: "Destinatario de la factura:", invoiceNumber: "Número de factura:", invoiceDate: "Fecha de factura:", dueDate: "Fecha de vencimiento:",
    invoiceTitle: "FACTURA", description: "Descripción", quantity: "Cantidad", unitPrice: "Precio unitario", total: "Total",
    netAmount: "Importe neto:", vat: "IVA:", totalAmount: "Importe total:",
    paymentTermsTitle: "Condiciones de pago",
    paymentTermsLine1: "Le rogamos que abone el importe facturado en un plazo de 3 días.",
    paymentTermsLine2: "Todos los impuestos y cotizaciones sociales son declarados y abonados por nosotros ante las autoridades.",
    bankDetails: "Datos bancarios:", unit: "Mes",
    vatId: "NIF/IVA:", taxNumber: "N° fiscal:", director: "Director:", regNumber: "N° registro:",
  },
  da: {
    invoiceRecipient: "Fakturamodtager:", invoiceNumber: "Fakturanummer:", invoiceDate: "Fakturadato:", dueDate: "Forfaldsdato:",
    invoiceTitle: "FAKTURA", description: "Beskrivelse", quantity: "Antal", unitPrice: "Enhedspris", total: "Total",
    netAmount: "Nettobeløb:", vat: "Moms:", totalAmount: "Totalbeløb:",
    paymentTermsTitle: "Betalingsbetingelser",
    paymentTermsLine1: "Vi beder venligst om, at det fakturerede beløb overføres inden for 3 dage.",
    paymentTermsLine2: "Alle skatter og sociale bidrag indberettes og betales af os til myndighederne.",
    bankDetails: "Bankoplysninger:", unit: "Måned",
    vatId: "Moms-nr:", taxNumber: "Skattenummer:", director: "Direktør:", regNumber: "Reg.nr:",
  },
  no: {
    invoiceRecipient: "Fakturamottaker:", invoiceNumber: "Fakturanummer:", invoiceDate: "Fakturadato:", dueDate: "Forfallsdato:",
    invoiceTitle: "FAKTURA", description: "Beskrivelse", quantity: "Antall", unitPrice: "Enhetspris", total: "Total",
    netAmount: "Nettobeløp:", vat: "MVA:", totalAmount: "Totalbeløp:",
    paymentTermsTitle: "Betalingsbetingelser",
    paymentTermsLine1: "Vi ber vennligst om at det fakturerte beløpet overføres innen 3 dager.",
    paymentTermsLine2: "Alle skatter og sosiale avgifter rapporteres og betales av oss til myndighetene.",
    bankDetails: "Bankdetaljer:", unit: "Måned",
    vatId: "MVA-nr:", taxNumber: "Skattenummer:", director: "Direktør:", regNumber: "Reg.nr:",
  },
  cs: {
    invoiceRecipient: "Příjemce faktury:", invoiceNumber: "Číslo faktury:", invoiceDate: "Datum vystavení:", dueDate: "Datum splatnosti:",
    invoiceTitle: "FAKTURA", description: "Popis", quantity: "Množství", unitPrice: "Jednotková cena", total: "Celkem",
    netAmount: "Částka bez DPH:", vat: "DPH:", totalAmount: "Celková částka:",
    paymentTermsTitle: "Platební podmínky",
    paymentTermsLine1: "Žádáme Vás o uhrazení fakturované částky do 3 dnů.",
    paymentTermsLine2: "Všechny daně a sociální odvody jsou námi přiznány a odvedeny příslušným úřadům.",
    bankDetails: "Bankovní spojení:", unit: "Měsíc",
    vatId: "DIČ:", taxNumber: "IČO:", director: "Jednatel:", regNumber: "Reg. č.:",
  },
  pl: {
    invoiceRecipient: "Odbiorca faktury:", invoiceNumber: "Numer faktury:", invoiceDate: "Data wystawienia:", dueDate: "Termin płatności:",
    invoiceTitle: "FAKTURA", description: "Opis", quantity: "Ilość", unitPrice: "Cena jednostkowa", total: "Razem",
    netAmount: "Kwota netto:", vat: "VAT:", totalAmount: "Kwota brutto:",
    paymentTermsTitle: "Warunki płatności",
    paymentTermsLine1: "Uprzejmie prosimy o uregulowanie kwoty faktury w ciągu 3 dni.",
    paymentTermsLine2: "Wszystkie podatki i składki socjalne są przez nas zgłaszane i odprowadzane do odpowiednich urzędów.",
    bankDetails: "Dane bankowe:", unit: "Miesiąc",
    vatId: "NIP:", taxNumber: "Nr podatkowy:", director: "Dyrektor:", regNumber: "Nr rejestrowy:",
  },
  sv: {
    invoiceRecipient: "Fakturamottagare:", invoiceNumber: "Fakturanummer:", invoiceDate: "Fakturadatum:", dueDate: "Förfallodatum:",
    invoiceTitle: "FAKTURA", description: "Beskrivning", quantity: "Antal", unitPrice: "Enhetspris", total: "Totalt",
    netAmount: "Nettobelopp:", vat: "Moms:", totalAmount: "Totalbelopp:",
    paymentTermsTitle: "Betalningsvillkor",
    paymentTermsLine1: "Vi ber vänligen att det fakturerade beloppet överförs inom 3 dagar.",
    paymentTermsLine2: "Alla skatter och sociala avgifter rapporteras och betalas av oss till myndigheterna.",
    bankDetails: "Bankuppgifter:", unit: "Månad",
    vatId: "Moms-nr:", taxNumber: "Skattenummer:", director: "Direktör:", regNumber: "Reg.nr:",
  },
};

// ── Email translations ─────────────────────────────────────────────
const EMAIL_TRANSLATIONS: Record<Lang, {
  subject: (invoiceNumber: string, monthLabel: string, price: string) => string;
  greeting: (name: string) => string;
  body: (monthLabel: string) => string;
  invoiceNumberLabel: string; periodLabel: string; amountLabel: string;
  attachmentNote: string; paymentRequest: string; questionsNote: string;
  closing: string;
}> = {
  en: {
    subject: (inv, month, price) => `Invoice ${inv} – ${month} – ${price}`,
    greeting: (name) => `Hello ${name},`,
    body: (month) => `Please find attached your invoice for <strong>${month}</strong>.`,
    invoiceNumberLabel: "Invoice Number:", periodLabel: "Period:", amountLabel: "Amount:",
    attachmentNote: "The invoice is attached as a PDF.", paymentRequest: "Please arrange payment within 3 days.",
    questionsNote: "If you have any questions, please don't hesitate to contact us.", closing: "Kind regards,",
  },
  de: {
    subject: (inv, month, price) => `Rechnung ${inv} – ${month} – ${price}`,
    greeting: (name) => `Hallo ${name},`,
    body: (month) => `anbei erhalten Sie Ihre Rechnung für <strong>${month}</strong>.`,
    invoiceNumberLabel: "Rechnungsnummer:", periodLabel: "Zeitraum:", amountLabel: "Betrag:",
    attachmentNote: "Die Rechnung finden Sie als PDF im Anhang.", paymentRequest: "Bitte veranlassen Sie die Zahlung innerhalb von 3 Tagen.",
    questionsNote: "Bei Fragen stehen wir Ihnen gerne zur Verfügung.", closing: "Mit freundlichen Grüßen,",
  },
  nl: {
    subject: (inv, month, price) => `Factuur ${inv} – ${month} – ${price}`,
    greeting: (name) => `Hallo ${name},`,
    body: (month) => `bijgevoegd vindt u uw factuur voor <strong>${month}</strong>.`,
    invoiceNumberLabel: "Factuurnummer:", periodLabel: "Periode:", amountLabel: "Bedrag:",
    attachmentNote: "De factuur is als PDF bijgevoegd.", paymentRequest: "Gelieve de betaling binnen 3 dagen te regelen.",
    questionsNote: "Heeft u vragen? Neem gerust contact met ons op.", closing: "Met vriendelijke groet,",
  },
  fr: {
    subject: (inv, month, price) => `Facture ${inv} – ${month} – ${price}`,
    greeting: (name) => `Bonjour ${name},`,
    body: (month) => `veuillez trouver ci-joint votre facture pour <strong>${month}</strong>.`,
    invoiceNumberLabel: "Numéro de facture:", periodLabel: "Période:", amountLabel: "Montant:",
    attachmentNote: "La facture est jointe en PDF.", paymentRequest: "Merci de procéder au paiement dans un délai de 3 jours.",
    questionsNote: "Pour toute question, n'hésitez pas à nous contacter.", closing: "Cordialement,",
  },
  es: {
    subject: (inv, month, price) => `Factura ${inv} – ${month} – ${price}`,
    greeting: (name) => `Hola ${name},`,
    body: (month) => `adjunto encontrará su factura para <strong>${month}</strong>.`,
    invoiceNumberLabel: "Número de factura:", periodLabel: "Período:", amountLabel: "Importe:",
    attachmentNote: "La factura se adjunta en formato PDF.", paymentRequest: "Le rogamos que realice el pago en un plazo de 3 días.",
    questionsNote: "Si tiene alguna pregunta, no dude en contactarnos.", closing: "Un cordial saludo,",
  },
  da: {
    subject: (inv, month, price) => `Faktura ${inv} – ${month} – ${price}`,
    greeting: (name) => `Hej ${name},`,
    body: (month) => `vedlagt finder du din faktura for <strong>${month}</strong>.`,
    invoiceNumberLabel: "Fakturanummer:", periodLabel: "Periode:", amountLabel: "Beløb:",
    attachmentNote: "Fakturaen er vedhæftet som PDF.", paymentRequest: "Vi beder dig venligst om at betale inden for 3 dage.",
    questionsNote: "Har du spørgsmål, er du velkommen til at kontakte os.", closing: "Med venlig hilsen,",
  },
  no: {
    subject: (inv, month, price) => `Faktura ${inv} – ${month} – ${price}`,
    greeting: (name) => `Hei ${name},`,
    body: (month) => `vedlagt finner du din faktura for <strong>${month}</strong>.`,
    invoiceNumberLabel: "Fakturanummer:", periodLabel: "Periode:", amountLabel: "Beløp:",
    attachmentNote: "Fakturaen er vedlagt som PDF.", paymentRequest: "Vi ber deg vennligst om å betale innen 3 dager.",
    questionsNote: "Har du spørsmål, er du velkommen til å kontakte oss.", closing: "Med vennlig hilsen,",
  },
  cs: {
    subject: (inv, month, price) => `Faktura ${inv} – ${month} – ${price}`,
    greeting: (name) => `Dobrý den ${name},`,
    body: (month) => `v příloze naleznete svou fakturu za <strong>${month}</strong>.`,
    invoiceNumberLabel: "Číslo faktury:", periodLabel: "Období:", amountLabel: "Částka:",
    attachmentNote: "Faktura je přiložena ve formátu PDF.", paymentRequest: "Žádáme Vás o uhrazení do 3 dnů.",
    questionsNote: "V případě dotazů nás neváhejte kontaktovat.", closing: "S pozdravem,",
  },
  pl: {
    subject: (inv, month, price) => `Faktura ${inv} – ${month} – ${price}`,
    greeting: (name) => `Dzień dobry ${name},`,
    body: (month) => `w załączeniu przesyłamy fakturę za <strong>${month}</strong>.`,
    invoiceNumberLabel: "Numer faktury:", periodLabel: "Okres:", amountLabel: "Kwota:",
    attachmentNote: "Faktura jest załączona w formacie PDF.", paymentRequest: "Uprzejmie prosimy o dokonanie płatności w ciągu 3 dni.",
    questionsNote: "W razie pytań prosimy o kontakt.", closing: "Z poważaniem,",
  },
  sv: {
    subject: (inv, month, price) => `Faktura ${inv} – ${month} – ${price}`,
    greeting: (name) => `Hej ${name},`,
    body: (month) => `bifogat finner du din faktura för <strong>${month}</strong>.`,
    invoiceNumberLabel: "Fakturanummer:", periodLabel: "Period:", amountLabel: "Belopp:",
    attachmentNote: "Fakturan bifogas som PDF.", paymentRequest: "Vänligen betala inom 3 dagar.",
    questionsNote: "Har du frågor är du välkommen att kontakta oss.", closing: "Med vänliga hälsningar,",
  },
};

// ── Invoice DB text translations ───────────────────────────────────
const INVOICE_DB_TEXT: Record<Lang, {
  notes: (monthLabel: string) => string;
  paymentTerms: string;
  lineDescription: (desc: string | null, monthLabel: string) => string;
}> = {
  en: { notes: (m) => `Automatically generated invoice for ${m}`, paymentTerms: "Payable within 3 days", lineDescription: (d, m) => d ? `${d} – ${m}` : `Monthly Service – ${m}` },
  de: { notes: (m) => `Automatisch generierte Rechnung für ${m}`, paymentTerms: "Zahlbar innerhalb von 3 Tagen", lineDescription: (d, m) => d ? `${d} – ${m}` : `Monatliche Dienstleistung – ${m}` },
  nl: { notes: (m) => `Automatisch gegenereerde factuur voor ${m}`, paymentTerms: "Betaalbaar binnen 3 dagen", lineDescription: (d, m) => d ? `${d} – ${m}` : `Maandelijkse dienst – ${m}` },
  fr: { notes: (m) => `Facture générée automatiquement pour ${m}`, paymentTerms: "Payable sous 3 jours", lineDescription: (d, m) => d ? `${d} – ${m}` : `Service mensuel – ${m}` },
  es: { notes: (m) => `Factura generada automáticamente para ${m}`, paymentTerms: "Pagadero en 3 días", lineDescription: (d, m) => d ? `${d} – ${m}` : `Servicio mensual – ${m}` },
  da: { notes: (m) => `Automatisk genereret faktura for ${m}`, paymentTerms: "Betales inden 3 dage", lineDescription: (d, m) => d ? `${d} – ${m}` : `Månedlig service – ${m}` },
  no: { notes: (m) => `Automatisk generert faktura for ${m}`, paymentTerms: "Betales innen 3 dager", lineDescription: (d, m) => d ? `${d} – ${m}` : `Månedlig tjeneste – ${m}` },
  cs: { notes: (m) => `Automaticky vygenerovaná faktura za ${m}`, paymentTerms: "Splatné do 3 dnů", lineDescription: (d, m) => d ? `${d} – ${m}` : `Měsíční služba – ${m}` },
  pl: { notes: (m) => `Automatycznie wygenerowana faktura za ${m}`, paymentTerms: "Płatne w ciągu 3 dni", lineDescription: (d, m) => d ? `${d} – ${m}` : `Usługa miesięczna – ${m}` },
  sv: { notes: (m) => `Automatiskt genererad faktura för ${m}`, paymentTerms: "Betalas inom 3 dagar", lineDescription: (d, m) => d ? `${d} – ${m}` : `Månadstjänst – ${m}` },
};

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
  { label: "UK Bank Account (Wise)", iban: "GB73 TRWI 2314 7059 8496 33", sortCode: "23-14-70", accountNumber: "59849633", address: "56 Shoreditch High Street, London" },
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
  lang: Lang,
): Promise<{ invoiceId: string; invoiceNumber: string; issueDate: string }> {
  const { data: invoiceNumber, error: rpcErr } = await supabase.rpc("generate_invoice_number", { prefix_param: "INV" });
  if (rpcErr) throw new Error(`Failed to generate invoice number: ${rpcErr.message}`);

  const totalAmount = contract.monthly_amount;
  const netAmount = totalAmount;
  const vatAmount = 0;
  const issueDate = new Date().toISOString().split("T")[0];
  const userId = contract.created_by || "00000000-0000-0000-0000-000000000000";
  const dbText = INVOICE_DB_TEXT[lang];

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
      notes: dbText.notes(monthLabel),
      payment_terms: dbText.paymentTerms,
      next_reminder_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    })
    .select("id")
    .single();

  if (invErr) throw new Error(`Failed to create invoice: ${invErr.message}`);

  const description = dbText.lineDescription(contract.description, monthLabel);

  await supabase.from("invoice_line_items").insert({
    invoice_id: invoice.id,
    item_description: description,
    quantity: 1,
    unit: PDF_LABELS[lang].unit,
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
  lang: Lang,
): Uint8Array {
  const L = PDF_LABELS[lang];
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
  doc.text(`${L.vatId} ${COMPANY.vatId} | ${L.taxNumber} ${COMPANY.taxNumber}`, marginLeft, y);
  y += 5;
  doc.text(`${L.director} ${COMPANY.director} | ${L.regNumber} ${COMPANY.registrationNumber}`, marginLeft, y);
  y += 3;

  // Separator line
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(marginLeft, y, pageWidth - marginRight, y);
  y += 10;

  // ── Client info ──
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(L.invoiceRecipient, marginLeft, y);
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
  const detailsY = y - 22;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(`${L.invoiceNumber} ${invoiceNumber}`, detailsX, detailsY, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.text(`${L.invoiceDate} ${formatDate(issueDate)}`, detailsX, detailsY + 6, { align: "right" });
  doc.text(`${L.dueDate} ${formatDate(dueDate)}`, detailsX, detailsY + 12, { align: "right" });

  // ── Title ──
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(L.invoiceTitle, marginLeft, y);
  y += 10;

  // ── Line items table ──
  const colWidths = [90, 20, 30, 30];
  const headers = [L.description, L.quantity, L.unitPrice, L.total];

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

  doc.setFont("helvetica", "normal");
  colX = marginLeft + 2;
  const fp = (v: number) => formatPrice(v, currency);
  const rowData = [description, "1", fp(netAmount), fp(netAmount)];
  rowData.forEach((val, i) => {
    doc.text(val, colX, y);
    colX += colWidths[i];
  });
  y += 10;

  doc.setDrawColor(200, 200, 200);
  doc.line(marginLeft, y, pageWidth - marginRight, y);
  y += 8;

  // ── Totals ──
  const totalsX = pageWidth - marginRight - 60;
  doc.setFontSize(10);
  doc.text(L.netAmount, totalsX, y);
  doc.text(fp(netAmount), pageWidth - marginRight, y, { align: "right" });
  y += 6;
  doc.text(L.vat, totalsX, y);
  doc.text(fp(vatAmount), pageWidth - marginRight, y, { align: "right" });
  y += 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(L.totalAmount, totalsX, y);
  doc.text(fp(totalAmount), pageWidth - marginRight, y, { align: "right" });
  y += 15;

  // ── Payment terms ──
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(L.paymentTermsLine1, marginLeft, y);
  y += 5;
  doc.text(L.paymentTermsLine2, marginLeft, y);
  y += 12;

  // ── Bank details ──
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(L.bankDetails, marginLeft, y);
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
    if (acc.bic) {
      doc.text(`BIC: ${acc.bic}`, marginLeft + 5, y);
      y += 5;
    }
    if (acc.bank) {
      doc.text(`Bank: ${acc.bank}`, marginLeft + 5, y);
      y += 5;
    }
    if (acc.blz) {
      doc.text(`BLZ: ${acc.blz} | Konto: ${acc.account}`, marginLeft + 5, y);
      y += 5;
    }
    if (acc.sortCode) {
      doc.text(`Sort Code: ${acc.sortCode}`, marginLeft + 5, y);
      y += 5;
    }
    if (acc.accountNumber) {
      doc.text(`Account Number: ${acc.accountNumber}`, marginLeft + 5, y);
      y += 5;
    }
    if (acc.address) {
      doc.text(`Address: ${acc.address}`, marginLeft + 5, y);
      y += 5;
    }
    y += 3;
  }

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
  lang: Lang,
): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY_ABMEDIA not configured");
    return false;
  }
  const formattedPrice = formatPrice(totalAmount, currency);
  const base64Pdf = btoa(String.fromCharCode(...new Uint8Array(pdfBytes)));
  const E = EMAIL_TRANSLATIONS[lang];

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #1a1a1a;">${E.subject(invoiceNumber, monthLabel, formattedPrice)}</h2>
      <p>${E.greeting(clientName)}</p>
      <p>${E.body(monthLabel)}</p>
      <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #666;">${E.invoiceNumberLabel}</td><td style="padding: 8px 0; font-weight: bold;">${invoiceNumber}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;">${E.periodLabel}</td><td style="padding: 8px 0; font-weight: bold;">${monthLabel}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;">${E.amountLabel}</td><td style="padding: 8px 0; font-weight: bold; font-size: 18px; color: #2563eb;">${formattedPrice}</td></tr>
        </table>
      </div>
      <p>${E.attachmentNote}</p>
      <p>${E.paymentRequest}</p>
      <p>${E.questionsNote}</p>
      <br/><p>${E.closing}<br/><strong>AB Media Team</strong></p>
    </div>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: "Thomas Klein <noreply@abm-team.com>",
        to: [to],
        subject: E.subject(invoiceNumber, monthLabel, formattedPrice),
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

// ── Send team notifications in parallel (stays in German) ──────────
async function sendTeamNotifications(
  clientName: string,
  monthLabel: string,
  amount: number,
  currency: string,
  invoiceNumber: string,
  pdfBase64?: string,
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
            ...(pdfBase64 ? { attachments: [{ filename: `${invoiceNumber}.pdf`, content: pdfBase64 }] } : {}),
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
    if (i + 2 < TEAM_EMAILS.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return successCount;
}

// ── Create in-app notifications (stays in German) ──────────────────
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

    console.log(`Processing monthly installments for ${currentMonth + 1}/${currentYear}`);

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
        // Detect language from company address
        const lang = detectLanguageFromAddress(contract.company_address);
        const monthLabel = `${MONTH_NAMES[lang][currentMonth]} ${currentYear}`;
        // German month label for checking existing installments (backward compat)
        const germanMonthLabel = `${MONTH_NAMES["de"][currentMonth]} ${currentYear}`;

        // Check if installment already exists (try localized label first, then German for backward compat)
        let { data: existing } = await supabase
          .from("monthly_installments")
          .select("id, email_sent, invoice_id")
          .eq("contract_id", contract.id)
          .eq("month_label", monthLabel)
          .maybeSingle();

        if (!existing && monthLabel !== germanMonthLabel) {
          const { data: existingDe } = await supabase
            .from("monthly_installments")
            .select("id, email_sent, invoice_id")
            .eq("contract_id", contract.id)
            .eq("month_label", germanMonthLabel)
            .maybeSingle();
          existing = existingDe;
        }

        if (existing) {
          if (!existing.email_sent) {
            let invoiceNumber = "";
            let invoiceId = existing.invoice_id;
            if (!invoiceId) {
              const clientId = await findOrCreateClient(supabase, contract);
              const dueDate = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-15`;
              const inv = await createInvoice(supabase, clientId, contract, monthLabel, dueDate, lang);
              invoiceId = inv.invoiceId;
              invoiceNumber = inv.invoiceNumber;
              invoicesCreated++;
              await supabase.from("monthly_installments").update({ invoice_id: invoiceId }).eq("id", existing.id);
            } else {
              const { data: invData } = await supabase.from("invoices").select("invoice_number").eq("id", invoiceId).single();
              invoiceNumber = invData?.invoice_number || "N/A";
            }

            const totalAmount = contract.monthly_amount;
            const netAmount = Math.round((totalAmount / 1.19) * 100) / 100;
            const vatAmount = Math.round((totalAmount - netAmount) * 100) / 100;
            const description = INVOICE_DB_TEXT[lang].lineDescription(contract.description, monthLabel);
            const dueDate = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-15`;

            const pdfBytes = generateInvoicePDF(
              invoiceNumber, new Date().toISOString().split("T")[0], dueDate,
              contract.client_name, contract.company_address, contract.client_email,
              description, netAmount, vatAmount, totalAmount, contract.currency || "EUR", lang,
            );

            const sent = await sendInvoiceEmail(
              contract.client_email, contract.client_name, monthLabel,
              invoiceNumber, totalAmount, contract.currency || "EUR", pdfBytes, lang,
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

        const clientId = await findOrCreateClient(supabase, contract);
        const dueDate = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-15`;
        const { invoiceId, invoiceNumber, issueDate } = await createInvoice(supabase, clientId, contract, monthLabel, dueDate, lang);
        invoicesCreated++;

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

        const totalAmount = contract.monthly_amount;
        const netAmount = Math.round((totalAmount / 1.19) * 100) / 100;
        const vatAmount = Math.round((totalAmount - netAmount) * 100) / 100;
        const description = INVOICE_DB_TEXT[lang].lineDescription(contract.description, monthLabel);

        const pdfBytes = generateInvoicePDF(
          invoiceNumber, issueDate, dueDate,
          contract.client_name, contract.company_address, contract.client_email,
          description, netAmount, vatAmount, totalAmount, contract.currency || "EUR", lang,
        );

        const sent = await sendInvoiceEmail(
          contract.client_email, contract.client_name, monthLabel,
          invoiceNumber, totalAmount, contract.currency || "EUR", pdfBytes, lang,
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
      JSON.stringify({ success: true, processed, invoicesCreated, emailsSent, teamEmailsSent }),
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
