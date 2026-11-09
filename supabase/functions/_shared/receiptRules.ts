// Rules for the public payment confirmation page: what may be revealed about a single Stripe checkout.

export const THANK_YOU_URL = (appUrl: string) => `${appUrl}/payment/thank-you?session_id={CHECKOUT_SESSION_ID}`;

/** Stripe Checkout session ids look like cs_live_… / cs_test_…; anything else is rejected before calling Stripe. */
export const isSessionId = (v: unknown): v is string => typeof v === "string" && /^cs_(live|test)_[A-Za-z0-9]{10,200}$/.test(v);

type Session = {
  payment_status?: string; status?: string; mode?: string; amount_total?: number | null; currency?: string | null; created?: number;
  metadata?: Record<string, string> | null;
  line_items?: { data?: { description?: string | null }[] } | null;
  payment_intent?: { latest_charge?: { receipt_url?: string | null } | null } | null;
  invoice?: { hosted_invoice_url?: string | null } | null;
  subscription?: { current_period_end?: number | null } | null;
};

export type Receipt = {
  kind: "order" | "package"; title: string; amount: number; currency: string; paid: boolean;
  date: string; reference: string; invoice_number: string | null; receipt_url: string | null; next_charge: string | null;
};

/** Minimal, non-personal summary of one checkout. Never includes names, emails or addresses. */
export function toReceipt(s: Session, sessionId: string, invoiceNumber: string | null): Receipt {
  const iso = (sec?: number | null) => (sec ? new Date(sec * 1000).toISOString() : null);
  return {
    kind: s.mode === "subscription" ? "package" : "order",
    title: s.line_items?.data?.[0]?.description || "",
    amount: (s.amount_total ?? 0) / 100,
    currency: (s.currency || "eur").toUpperCase(),
    paid: s.payment_status === "paid" || s.payment_status === "no_payment_required",
    date: iso(s.created) ?? new Date().toISOString(),
    reference: sessionId.slice(-10).toUpperCase(),
    invoice_number: invoiceNumber,
    receipt_url: s.payment_intent?.latest_charge?.receipt_url ?? s.invoice?.hosted_invoice_url ?? null,
    next_charge: s.mode === "subscription" ? iso(s.subscription?.current_period_end) : null,
  };
}
