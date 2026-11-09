export type InvoiceState = "paid" | "unpaid" | "overdue" | "cancelled";

/** One rule for how an invoice's payment state is shown to clients. `today` is YYYY-MM-DD. */
export function invoiceStatus(inv: { status: string; due_date: string | null }, today: string): InvoiceState {
  const s = (inv.status || "").toLowerCase();
  if (s === "paid") return "paid";
  if (s === "cancelled" || s === "canceled") return "cancelled";
  if (inv.due_date && inv.due_date.slice(0, 10) < today) return "overdue";
  return "unpaid";
}

export const todayIso = () => new Date().toISOString().slice(0, 10);

export function invoiceSummary(invs: { status: string; due_date: string | null; total_amount: number }[], today: string) {
  const out = { paidCount: 0, paidTotal: 0, unpaidCount: 0, unpaidTotal: 0 };
  for (const i of invs) {
    const st = invoiceStatus(i, today);
    if (st === "paid") { out.paidCount++; out.paidTotal += Number(i.total_amount) || 0; }
    else if (st !== "cancelled") { out.unpaidCount++; out.unpaidTotal += Number(i.total_amount) || 0; }
  }
  return out;
}
