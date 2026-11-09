import { supabase } from "@/integrations/supabase/client";

export type StripeAction = "create_checkout" | "cancel" | "resume" | "overview" | "pay" | "portal";

export async function stripeBilling<T = { url?: string; ok?: boolean; cancel_at?: string | null }>(
  action: StripeAction,
  payload: { contract_id?: string; send_email?: boolean } = {},
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
}

/** Label for the team/client badge. */
export function stripeStatusLabel(c: StripeContractFields): string | null {
  if (c.payment_method !== "stripe") return null;
  if (c.cancel_at && c.stripe_status !== "canceled") return "Cancels";
  switch (c.stripe_status) {
    case "active": case "trialing": return "Stripe: active";
    case "past_due": case "unpaid": return "Payment failed";
    case "canceled": return "Stripe: cancelled";
    default: return "Awaiting payment";
  }
}
