// Minimal Stripe REST client (form-encoded) + billing email helper.

function encode(obj: Record<string, unknown>, prefix = "", out: string[] = []): string[] {
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (typeof v === "object") encode(v as Record<string, unknown>, key, out);
    else out.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`);
  }
  return out;
}

export async function stripe<T = Record<string, unknown>>(path: string, params?: Record<string, unknown>, method = params ? "POST" : "GET"): Promise<T> {
  const key = Deno.env.get("STRIPE_SECRET_KEY");
  if (!key) throw new Error("Stripe is not configured");
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method,
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/x-www-form-urlencoded", "Stripe-Version": "2024-06-20" },
    body: params && method !== "GET" ? encode(params).join("&") : undefined,
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`Stripe: ${body?.error?.message ?? res.status}`);
  return body as T;
}

export const APP_URL = "https://www.empriatech.com";
export const BILLING_INBOX = "invoice@mediaamarketing.com";

export async function sendBillingEmail(to: string, subject: string, html: string) {
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY_ABMEDIA")}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: "Media Marketing <noreply@mediaamarketing.com>", to: [to], reply_to: BILLING_INBOX, subject, html }),
    });
    await new Promise((r) => setTimeout(r, 600)); // Resend: max 2/sec
  } catch (e) { console.error("billing email failed", e); }
}

export const eur = (cents: number, currency = "EUR") =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: currency.toUpperCase() }).format(cents / 100);

export const emailShell = (title: string, body: string) => `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#1e293b">
<h2 style="color:#0f2747">${title}</h2>${body}
<p style="margin-top:24px">Media Marketing<br/><a href="https://www.mediaamarketing.com/de">www.mediaamarketing.com</a></p></div>`;

export const button = (href: string, label: string) =>
  `<p><a href="${href}" style="display:inline-block;background:#0f2747;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none">${label}</a></p>`;
