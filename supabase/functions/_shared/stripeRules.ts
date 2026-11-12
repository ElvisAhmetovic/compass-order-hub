// Pure Stripe helpers (no network) so they can be unit-tested.

/**
 * Amount charged per Stripe billing cycle, in cents (gross incl. VAT when enabled).
 * `monthly_amount` already holds the per-installment amount (total / installments), so it is NOT
 * multiplied by the billing frequency. VAT is stored as a fraction (0.19); percent values (19) are accepted too.
 */
export function cycleAmountCents(installmentAmount: number, _billingFrequency: number, vatEnabled: boolean | null, vatRate: number | null): number {
  const net = Number(installmentAmount || 0);
  const r = Number(vatRate ?? 0);
  const fraction = r > 1 ? r / 100 : r;
  const gross = vatEnabled ? net * (1 + fraction) : net;
  return Math.round(gross * 100);
}

/** Product name on the Stripe page: typed value, then saved value, then "client – website". */
export function productNameFor(input: string | null | undefined, saved: string | null | undefined, clientName: string, website: string | null): string {
  const pick = [input, saved].map((v) => (v ?? "").trim()).find((v) => v.length > 0);
  return (pick ?? `${clientName} – ${website || "Paket"}`).slice(0, 120);
}

/** Stripe recurring settings for a package's billing frequency (1 = monthly, 3 = quarterly, 12 = yearly). */
export function recurringFor(billingFrequency: number): { interval: "month" | "year"; interval_count: number } {
  const months = Math.max(1, Math.floor(billingFrequency || 1));
  if (months === 12) return { interval: "year", interval_count: 1 };
  return { interval: "month", interval_count: months };
}

/** First day (YYYY-MM-01) of the month a Stripe period starts in (UTC). */
export function dueDateFromPeriodStart(unixSeconds: number): string {
  const d = new Date(unixSeconds * 1000);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

/** 1-based month number of a due date relative to the package start date. */
export function monthNumberFor(startDate: string, dueDate: string): number {
  const s = new Date(startDate + (startDate.length === 10 ? "T00:00:00Z" : ""));
  const d = new Date(dueDate + "T00:00:00Z");
  return Math.max(1, (d.getUTCFullYear() - s.getUTCFullYear()) * 12 + (d.getUTCMonth() - s.getUTCMonth()) + 1);
}

/** Stripe statuses where the subscription itself bills the client (bank-transfer invoices must not be sent). */
export function stripeBillsContract(paymentMethod: string | null, stripeStatus: string | null): boolean {
  return paymentMethod === "stripe" && ["active", "trialing", "past_due", "unpaid"].includes(stripeStatus ?? "");
}

async function hmacHex(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Verifies a Stripe-Signature header (v1 scheme, 5 minute tolerance). */
export async function verifyStripeSignature(payload: string, header: string | null, secret: string, nowSec = Math.floor(Date.now() / 1000), toleranceSec = 300): Promise<boolean> {
  if (!header || !secret) return false;
  const parts = header.split(",").map((p) => p.trim().split("="));
  const t = parts.find(([k]) => k === "t")?.[1];
  const sigs = parts.filter(([k]) => k === "v1").map(([, v]) => v);
  if (!t || sigs.length === 0) return false;
  if (Math.abs(nowSec - Number(t)) > toleranceSec) return false;
  const expected = await hmacHex(secret, `${t}.${payload}`);
  return sigs.some((s) => s.length === expected.length && s === expected);
}

export const signForTest = hmacHex;

/** Number of Stripe charges for a package length: 12 months monthly = 12, 12 months quarterly = 4. 0/empty length = unlimited (null). */
export function chargesFor(durationMonths: number | null | undefined, billingFrequency: number): number | null {
  const d = Math.floor(Number(durationMonths ?? 0));
  if (!d || d <= 0) return null;
  const f = Math.max(1, Math.floor(billingFrequency || 1));
  return Math.ceil(d / f);
}

/** When the subscription must stop so the client is charged exactly `chargesFor` times (unix seconds), or null for unlimited. */
export function subscriptionEndUnix(startUnix: number, durationMonths: number | null | undefined, billingFrequency: number): number | null {
  const n = chargesFor(durationMonths, billingFrequency);
  if (n === null) return null;
  const d = new Date(startUnix * 1000);
  const months = n * Math.max(1, Math.floor(billingFrequency || 1));
  const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + months, d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes()));
  // Stop a little before the next renewal so no extra charge is created.
  return Math.floor(end.getTime() / 1000) - 3600;
}

/** A Stripe Checkout link is valid 24 hours. */
export function checkoutLinkState(url: string | null, createdAt: string | null, subscribed: boolean, now = Date.now()): "none" | "paid" | "waiting" | "expired" {
  if (subscribed) return "paid";
  if (!url) return "none";
  if (!createdAt) return "waiting";
  return now - new Date(createdAt).getTime() > 24 * 3600 * 1000 ? "expired" : "waiting";
}

/** "Visa •••• 4242", "SEPA •••• 3000", or null. */
export function paymentMethodLabel(pm: { type?: string; card?: { brand?: string; last4?: string }; sepa_debit?: { last4?: string } } | null | undefined): string | null {
  if (!pm) return null;
  if (pm.card?.last4) { const b = pm.card.brand ?? "Card"; return `${b.charAt(0).toUpperCase()}${b.slice(1)} •••• ${pm.card.last4}`; }
  if (pm.sepa_debit?.last4) return `SEPA •••• ${pm.sepa_debit.last4}`;
  return pm.type ? pm.type : null;
}

/** Status after a refund: full refund -> "refunded", partial -> "partially_refunded". */
export function refundStatus(amountCents: number, refundedCents: number): "paid" | "refunded" | "partially_refunded" {
  if (!(refundedCents > 0)) return "paid";
  return refundedCents >= amountCents ? "refunded" : "partially_refunded";
}

/** Money counts only when Stripe says it has cleared (SEPA/bank redirects arrive later). */
export function sessionIsPaid(paymentStatus: string | null | undefined): boolean {
  return paymentStatus === "paid" || paymentStatus === "no_payment_required";
}

/** Test mode is on only when explicitly enabled AND a test key exists. */
export function useStripeTestMode(flag: string | undefined, testKey: string | undefined): boolean {
  return flag === "true" && !!testKey;
}
