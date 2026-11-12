import { supabase } from "@/integrations/supabase/client";

export type StripeAction = "create_checkout" | "cancel" | "resume" | "overview" | "pay" | "portal" | "create_order_link" | "send_order_link";

export async function stripeBilling<T = { url?: string; ok?: boolean; cancel_at?: string | null }>(
  action: StripeAction,
  payload: {
    contract_id?: string; send_email?: boolean; product_name?: string; product_description?: string;
    order_id?: string; title?: string; description?: string; net_amount?: number; vat_enabled?: boolean; vat_rate?: number; currency?: string;
  } = {},
): Promise<T> {
  const { data, error } = await supabase.functions.invoke("stripe-billing", { body: { action, ...payload } });
  if (error) {
    let msg = error.message;
    try { const b = await (error as { context?: Response }).context?.json(); if (b?.error) msg = String(b.error); } catch { /* ignore */ }
    throw new Error(msg);
  }
  return data as T;
}

export interface StripeContractFields {
  payment_method?: string | null;
  stripe_status?: string | null;
  stripe_subscription_id?: string | null;
  stripe_checkout_url?: string | null;
  current_period_end?: string | null;
  cancel_at?: string | null;
  stripe_ends_at?: string | null;
  stripe_checkout_created_at?: string | null;
}

/** Label for the team/client badge. */
export function stripeStatusLabel(c: StripeContractFields): string | null {
  if (c.payment_method !== "stripe") return null;
  if (c.cancel_at && c.stripe_status !== "canceled") {
    // Planned end of a fixed-length package, not a cancellation.
    if (c.stripe_ends_at && Math.abs(new Date(c.cancel_at).getTime() - new Date(c.stripe_ends_at).getTime()) < 2 * 86400e3) return "Ends";
    return "Cancels";
  }
  switch (c.stripe_status) {
    case "active": case "trialing": return "Stripe: active";
    case "past_due": case "unpaid": return "Payment failed";
    case "canceled": return "Stripe: cancelled";
    default: return "Awaiting payment";
  }
}

/** Stripe Checkout links are valid 24 hours (mirrors `checkoutLinkState` in the server rules). */
export function contractLinkState(c: StripeContractFields, now = Date.now()): "none" | "paid" | "waiting" | "expired" {
  const subscribed = !!c.stripe_subscription_id && ["active", "trialing", "past_due", "unpaid"].includes(c.stripe_status ?? "");
  if (subscribed) return "paid";
  if (!c.stripe_checkout_url) return "none";
  if (!c.stripe_checkout_created_at) return "waiting";
  return now - new Date(c.stripe_checkout_created_at).getTime() > 24 * 3600e3 ? "expired" : "waiting";
}

/** "4 of 12 paid" — total is null for packages without a fixed length. */
export function paidProgress(paidCount: number, durationMonths: number | null | undefined, billingFrequency: number): { paid: number; total: number | null } {
  const d = Math.floor(Number(durationMonths ?? 0));
  const f = Math.max(1, Math.floor(billingFrequency || 1));
  return { paid: paidCount, total: d > 0 ? Math.ceil(d / f) : null };
}
