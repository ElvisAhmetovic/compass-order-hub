import { useCallback, useEffect, useState } from "react";
import { stripeBilling } from "@/services/stripeBillingService";

export interface Contract {
  id: string; client_name: string; website: string | null; monthly_amount: number; billing_frequency: number;
  currency: string; vat_enabled: boolean | null; vat_rate: number | null; status: string;
  payment_method: string | null; stripe_status: string | null; current_period_end: string | null; cancel_at: string | null;
}
export interface Installment { id: string; contract_id: string; month_label: string; due_date: string; amount: number; currency: string; payment_status: string; paid_at: string | null }
export interface Payment { id: string; contract_id: string | null; order_id?: string | null; amount: number; currency: string; status: string; hosted_invoice_url: string | null; invoice_pdf_url: string | null; period_start: string | null; paid_at: string | null; created_at: string }
export interface Invoice { id: string; invoice_number: string; issue_date: string; due_date: string; total_amount: number; currency: string; status: string; order_id: string | null; stripe_payment_link: string | null; paid_at?: string | null }
export interface OrderLink { id: string; order_id: string; title: string; description: string | null; total_amount: number; currency: string; vat_enabled: boolean; vat_rate: number; url: string | null; status: string; paid_at: string | null; created_at: string }
export interface Overview { contracts: Contract[]; installments: Installment[]; payments: Payment[]; invoices: Invoice[]; order_links: OrderLink[] }

export const grossAmount = (c: Contract) => {
  const r = Number(c.vat_rate ?? 0); const f = r > 1 ? r / 100 : r;
  return Number(c.monthly_amount) * (c.vat_enabled ? 1 + f : 1);
};

/** Loads the client's billing; `error` is set when loading failed so the UI never shows "nothing owed" by mistake. */
export function useBillingOverview(orderId?: string) {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const r = await stripeBilling<Overview>("overview", orderId ? { order_id: orderId } : {});
      setData({ contracts: [], installments: [], payments: [], invoices: [], order_links: [], ...r });
    } catch (e) {
      console.error("Billing overview failed:", e);
      setData(null);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => { reload(); }, [reload]);

  return { data, loading, error, reload };
}
