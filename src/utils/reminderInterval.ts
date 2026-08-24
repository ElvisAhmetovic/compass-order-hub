import { supabase } from "@/integrations/supabase/client";

/** Default automated payment reminder interval: 7 days. */
export const DEFAULT_REMINDER_INTERVAL_HOURS = 168;

/** Returns an ISO timestamp `hours` (default 7 days) from now. */
export function nextReminderFromHours(hours?: number | null): string {
  const interval = hours && hours > 0 ? hours : DEFAULT_REMINDER_INTERVAL_HOURS;
  return new Date(Date.now() + interval * 60 * 60 * 1000).toISOString();
}

/** Reads the per-invoice interval and returns the next reminder timestamp. */
export async function nextReminderForInvoice(invoiceId: string): Promise<string> {
  const { data } = await supabase
    .from("invoices")
    .select("reminder_interval_hours")
    .eq("id", invoiceId)
    .maybeSingle();
  return nextReminderFromHours((data as { reminder_interval_hours?: number } | null)?.reminder_interval_hours);
}

/** Reads the interval of the invoice linked to an order and returns the next reminder timestamp. */
export async function nextReminderForOrder(orderId: string): Promise<string> {
  const { data } = await supabase
    .from("invoices")
    .select("reminder_interval_hours")
    .eq("order_id", orderId)
    .limit(1)
    .maybeSingle();
  return nextReminderFromHours((data as { reminder_interval_hours?: number } | null)?.reminder_interval_hours);
}
