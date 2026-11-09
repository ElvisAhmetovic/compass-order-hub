// Rules for offers that become monthly packages when the client accepts.
export type OfferPackage = {
  enabled: boolean;
  monthly_amount: number;
  billing_frequency: 1 | 3 | 12;
  duration_months: number;
  start_date: string; // YYYY-MM-DD
  use_stripe: boolean;
  stripe_product_name?: string;
};

/** Returns a valid package from offer.order_data.monthly_package, or null when off/invalid. */
export function parseOfferPackage(raw: unknown): OfferPackage | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Record<string, unknown>;
  if (p.enabled !== true) return null;
  const amount = Number(p.monthly_amount);
  const freq = Number(p.billing_frequency);
  const months = Number(p.duration_months);
  const start = String(p.start_date ?? "");
  if (!(amount > 0) || ![1, 3, 12].includes(freq) || !Number.isInteger(months) || months < 1 || months > 120) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start)) return null;
  const name = typeof p.stripe_product_name === "string" ? p.stripe_product_name.trim().slice(0, 120) : "";
  return {
    enabled: true,
    monthly_amount: Math.round(amount * 100) / 100,
    billing_frequency: freq as 1 | 3 | 12,
    duration_months: months,
    start_date: start,
    use_stripe: p.use_stripe === true,
    ...(name ? { stripe_product_name: name } : {}),
  };
}

/** Stripe link is sent only for a newly created package with Stripe chosen. */
export function shouldSendStripeLink(pkg: OfferPackage | null, createdNow: boolean): boolean {
  return !!pkg && pkg.use_stripe && createdNow;
}
