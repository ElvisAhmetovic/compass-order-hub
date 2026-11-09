// Pure Stripe helpers (no network) so they can be unit-tested.

/** Amount charged per Stripe billing cycle, in cents (gross incl. VAT when enabled). */
export function cycleAmountCents(monthlyAmount: number, billingFrequency: number, vatEnabled: boolean | null, vatRate: number | null): number {
  const months = Math.max(1, Math.floor(billingFrequency || 1));
  const net = Number(monthlyAmount || 0) * months;
  const gross = vatEnabled ? net * (1 + Number(vatRate ?? 0) / 100) : net;
  return Math.round(gross * 100);
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
