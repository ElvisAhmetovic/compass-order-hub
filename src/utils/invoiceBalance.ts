import { Invoice } from "@/types/invoice";

/** Total recorded payments for an invoice (0 when none are loaded). */
export const getPaidAmount = (invoice: Pick<Invoice, "payments">): number => {
  if (!Array.isArray(invoice.payments)) return 0;
  return invoice.payments.reduce((sum, p) => sum + (Number(p?.amount) || 0), 0);
};

/** Amount still owed on an invoice. Settled invoices always report 0. */
export const getOutstandingAmount = (
  invoice: Pick<Invoice, "payments" | "total_amount" | "status">
): number => {
  if (["paid", "cancelled", "refunded"].includes(invoice.status)) return 0;
  const outstanding = (Number(invoice.total_amount) || 0) - getPaidAmount(invoice);
  return outstanding > 0 ? outstanding : 0;
};

/** True when part of the invoice has been paid but a balance remains. */
export const isPartiallyPaid = (
  invoice: Pick<Invoice, "payments" | "total_amount" | "status">
): boolean => {
  const paid = getPaidAmount(invoice);
  return paid > 0 && getOutstandingAmount(invoice) > 0;
};
