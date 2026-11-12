import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, FileDown, Loader2, RefreshCw } from "lucide-react";
import { paidProgress } from "@/services/stripeBillingService";

interface PaymentRow {
  id: string; amount: number; currency: string; status: string; paid_at: string | null; created_at: string;
  period_start: string | null; period_end: string | null; hosted_invoice_url: string | null; invoice_pdf_url: string | null;
  payment_method_label: string | null; failure_reason: string | null;
}

interface Props {
  contractId: string;
  durationMonths: number | null;
  billingFrequency: number;
  nextCharge: string | null;
  endsAt: string | null;
  reloadKey?: unknown;
}

const day = (d: string | null) => (d ? new Date(d).toLocaleDateString("de-DE") : "–");
const money = (v: number, c: string) => new Intl.NumberFormat("de-DE", { style: "currency", currency: c || "EUR" }).format(Number(v));

/** Team view of every Stripe charge for one monthly package. */
const StripePaymentsPanel: React.FC<Props> = ({ contractId, durationMonths, billingFrequency, nextCharge, endsAt, reloadKey }) => {
  const [rows, setRows] = useState<PaymentRow[] | null>(null);
  const [error, setError] = useState(false);

  const load = async () => {
    setError(false);
    const { data, error: e } = await supabase.from("stripe_payments")
      .select("id, amount, currency, status, paid_at, created_at, period_start, period_end, hosted_invoice_url, invoice_pdf_url, payment_method_label, failure_reason")
      .eq("contract_id", contractId).order("created_at", { ascending: false });
    if (e) { setError(true); return; }
    setRows((data ?? []) as unknown as PaymentRow[]);
  };
  useEffect(() => { load(); }, [contractId, reloadKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const paidCount = (rows ?? []).filter((r) => r.status === "paid").length;
  const prog = paidProgress(paidCount, durationMonths, billingFrequency);

  return (
    <div className="border-t p-4 space-y-3" data-testid="stripe-payments-panel">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
        <span className="font-semibold">Stripe payments</span>
        <span>{prog.total ? `${prog.paid} of ${prog.total} paid` : `${prog.paid} paid`}</span>
        {nextCharge && <span className="text-muted-foreground">Next charge: {day(nextCharge)}</span>}
        {endsAt && <span className="text-muted-foreground">Stops automatically: {day(endsAt)}</span>}
      </div>
      {error ? (
        <div className="flex items-center gap-2 text-sm text-destructive">Couldn't load Stripe payments.
          <Button size="sm" variant="outline" onClick={load}><RefreshCw className="h-3 w-3 mr-1" />Try again</Button></div>
      ) : rows === null ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No Stripe payments yet. They appear here automatically when Stripe charges the client.</p>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-md border p-2 text-sm">
              <Badge variant={r.status === "paid" ? "default" : "destructive"}>{r.status === "paid" ? "Paid" : "Failed"}</Badge>
              <span className="font-medium">{money(r.amount, r.currency)}</span>
              <span>{r.status === "paid" ? `paid ${day(r.paid_at)}` : `tried ${day(r.created_at)}`}</span>
              {r.period_start && <span className="text-muted-foreground">period {day(r.period_start)} – {day(r.period_end)}</span>}
              {r.payment_method_label && <span className="text-muted-foreground">{r.payment_method_label}</span>}
              {r.failure_reason && <span className="text-destructive">{r.failure_reason}</span>}
              <span className="ml-auto flex gap-1">
                {r.hosted_invoice_url && <Button size="sm" variant="ghost" asChild><a href={r.hosted_invoice_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4 mr-1" />Receipt</a></Button>}
                {r.invoice_pdf_url && <Button size="sm" variant="ghost" asChild><a href={r.invoice_pdf_url} target="_blank" rel="noopener noreferrer"><FileDown className="h-4 w-4 mr-1" />PDF</a></Button>}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StripePaymentsPanel;
