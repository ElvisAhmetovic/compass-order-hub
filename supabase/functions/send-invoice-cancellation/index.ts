import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const TEAM_INBOX = "invoice@mediaamarketing.com";
const SIGNATURE = ["Annalena Klein", "Media Marketing", "+49 203 7090 7262", TEAM_INBOX, "Düsseldorfer Str. 32", "47051 Duisburg"];

type Copy = { subject: (n: string) => string; hello: (name: string) => string; body: (n: string) => string[]; regards: string };
const COPY: Record<string, Copy> = {
  en: {
    subject: (n) => `Invoice ${n} has been cancelled`,
    hello: (x) => `Hello ${x},`,
    body: (n) => [`we would like to let you know that your order and invoice ${n} have been cancelled.`, `You no longer need to pay this invoice, and you will not receive any further payment reminders for it.`, `If you have any questions, please contact us at ${TEAM_INBOX}.`],
    regards: "Kind regards,",
  },
  de: {
    subject: (n) => `Rechnung ${n} wurde storniert`,
    hello: (x) => `Guten Tag ${x},`,
    body: (n) => [`wir möchten Ihnen mitteilen, dass Ihr Auftrag und die Rechnung ${n} storniert wurden.`, `Diese Rechnung muss nicht mehr bezahlt werden, und Sie erhalten dazu keine weiteren Zahlungserinnerungen.`, `Bei Fragen erreichen Sie uns unter ${TEAM_INBOX}.`],
    regards: "Mit freundlichen Grüßen",
  },
  nl: {
    subject: (n) => `Factuur ${n} is geannuleerd`,
    hello: (x) => `Beste ${x},`,
    body: (n) => [`hierbij laten wij u weten dat uw opdracht en factuur ${n} zijn geannuleerd.`, `U hoeft deze factuur niet meer te betalen en u ontvangt hiervoor geen betalingsherinneringen meer.`, `Heeft u vragen? Neem contact met ons op via ${TEAM_INBOX}.`],
    regards: "Met vriendelijke groet,",
  },
  fr: {
    subject: (n) => `La facture ${n} a été annulée`,
    hello: (x) => `Bonjour ${x},`,
    body: (n) => [`nous vous informons que votre commande et la facture ${n} ont été annulées.`, `Vous n'avez plus à régler cette facture et vous ne recevrez plus de rappels de paiement à son sujet.`, `Pour toute question, contactez-nous à ${TEAM_INBOX}.`],
    regards: "Cordialement,",
  },
  it: {
    subject: (n) => `La fattura ${n} è stata annullata`,
    hello: (x) => `Buongiorno ${x},`,
    body: (n) => [`desideriamo informarla che il suo ordine e la fattura ${n} sono stati annullati.`, `Non è più necessario pagare questa fattura e non riceverà ulteriori solleciti di pagamento.`, `Per qualsiasi domanda può contattarci all'indirizzo ${TEAM_INBOX}.`],
    regards: "Cordiali saluti,",
  },
  es: {
    subject: (n) => `La factura ${n} ha sido cancelada`,
    hello: (x) => `Hola ${x}:`,
    body: (n) => [`le informamos de que su pedido y la factura ${n} han sido cancelados.`, `Ya no es necesario pagar esta factura y no recibirá más recordatorios de pago.`, `Si tiene alguna pregunta, escríbanos a ${TEAM_INBOX}.`],
    regards: "Saludos cordiales,",
  },
  da: {
    subject: (n) => `Faktura ${n} er annulleret`,
    hello: (x) => `Kære ${x},`,
    body: (n) => [`vi vil gerne oplyse, at din ordre og faktura ${n} er blevet annulleret.`, `Du skal ikke længere betale denne faktura, og du modtager ikke flere betalingspåmindelser.`, `Har du spørgsmål, kan du kontakte os på ${TEAM_INBOX}.`],
    regards: "Med venlig hilsen",
  },
  cs: {
    subject: (n) => `Faktura ${n} byla stornována`,
    hello: (x) => `Dobrý den, ${x},`,
    body: (n) => [`informujeme Vás, že Vaše objednávka a faktura ${n} byly stornovány.`, `Tuto fakturu již nemusíte platit a nebudete k ní dostávat žádné další upomínky.`, `V případě dotazů nás kontaktujte na ${TEAM_INBOX}.`],
    regards: "S pozdravem",
  },
  pt: {
    subject: (n) => `A fatura ${n} foi cancelada`,
    hello: (x) => `Olá ${x},`,
    body: (n) => [`informamos que a sua encomenda e a fatura ${n} foram canceladas.`, `Já não precisa de pagar esta fatura e não receberá mais lembretes de pagamento.`, `Se tiver alguma dúvida, contacte-nos em ${TEAM_INBOX}.`],
    regards: "Com os melhores cumprimentos,",
  },
};

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_RE = /^[0-9a-f-]{36}$/i;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
    const url = Deno.env.get("SUPABASE_URL")!;
    const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
    const { data: claims, error: authErr } = await userClient.auth.getClaims(auth.replace("Bearer ", ""));
    if (authErr || !claims?.claims) return json({ error: "Unauthorized" }, 401);

    const { invoice_id } = await req.json().catch(() => ({}));
    if (typeof invoice_id !== "string" || !UUID_RE.test(invoice_id)) return json({ error: "invoice_id required" }, 400);

    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: inv } = await admin
      .from("invoices")
      .select("id, invoice_number, status, language, order_id, bill_to_name, bill_to_email, total_amount, currency, client:clients(name, contact_person, email, auto_reminders_enabled)")
      .eq("id", invoice_id)
      .maybeSingle();
    if (!inv) return json({ error: "Invoice not found" }, 404);
    if (inv.status !== "cancelled") return json({ skipped: "not_cancelled" });
    // deno-lint-ignore no-explicit-any
    const client: any = Array.isArray(inv.client) ? inv.client[0] : inv.client;
    if (client?.auto_reminders_enabled === false) return json({ skipped: "client_opted_out" });
    const to = (inv.bill_to_email || client?.email || "").trim();
    if (!EMAIL_RE.test(to)) return json({ skipped: "no_email" });

    // Only once per cancellation
    const { data: already } = await admin
      .from("client_email_logs")
      .select("id, sent_at:created_at")
      .eq("template_name", "invoice_cancellation")
      .eq("custom_message", inv.id)
      .limit(1);
    const { data: cancelledInfo } = await admin.from("invoices").select("cancelled_at").eq("id", inv.id).maybeSingle();
    // deno-lint-ignore no-explicit-any
    const prev: any = already?.[0];
    if (prev && (!cancelledInfo?.cancelled_at || new Date(prev.sent_at) >= new Date(cancelledInfo.cancelled_at))) {
      return json({ skipped: "already_sent" });
    }

    const lang = COPY[(inv.language || "en").toLowerCase()] ? (inv.language || "en").toLowerCase() : "en";
    const c = COPY[lang];
    const name = client?.contact_person || inv.bill_to_name || client?.name || "";
    const subject = c.subject(inv.invoice_number);
    const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#1f2937;font-size:15px;line-height:1.6">
<p>${esc(c.hello(name).replace(/\s+,/, ","))}</p>
${c.body(inv.invoice_number).map((p) => `<p>${esc(p)}</p>`).join("")}
<p>${esc(c.regards)}<br>${SIGNATURE.map(esc).join("<br>")}</p></div>`;
    const text = [c.hello(name), "", ...c.body(inv.invoice_number), "", c.regards, ...SIGNATURE].join("\n");

    const key = Deno.env.get("RESEND_API_KEY_ABMEDIA");
    if (!key) return json({ error: "Email service not configured" }, 500);
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: "Media Marketing <noreply@mediaamarketing.com>", to: [to], bcc: [TEAM_INBOX], reply_to: TEAM_INBOX, subject, html, text }),
    });
    if (!res.ok) {
      const details = await res.text();
      console.error(`Resend failed [${res.status}]: ${details}`);
      return json({ error: "Email failed", status: res.status, details }, 502);
    }

    if (inv.order_id) await admin.from("client_email_logs").insert({
      order_id: inv.order_id, sent_to: to, sent_by_name: (claims.claims.email as string) || "System",
      company_name: client?.name || inv.bill_to_name || "Unknown", order_price: inv.total_amount,
      currency: inv.currency || "EUR", custom_message: inv.id, template_name: "invoice_cancellation",
      email_subject: subject, invoice_number: inv.invoice_number,
    });
    return json({ sent: true, to, language: lang });
  } catch (e) {
    console.error(e);
    return json({ error: String(e) }, 500);
  }
});
