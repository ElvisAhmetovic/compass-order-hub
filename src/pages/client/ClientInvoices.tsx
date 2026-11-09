import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import ClientLayout from "@/components/client-portal/ClientLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CreditCard, FileText, Loader2, Receipt, ExternalLink } from "lucide-react";
import { useLanguage } from "@/context/ClientLanguageContext";
import { useToast } from "@/hooks/use-toast";
import { stripeBilling } from "@/services/stripeBillingService";

interface Contract {
  id: string; client_name: string; website: string | null; monthly_amount: number; billing_frequency: number;
  currency: string; vat_enabled: boolean | null; vat_rate: number | null; status: string;
  payment_method: string | null; stripe_status: string | null; current_period_end: string | null; cancel_at: string | null;
}
interface Installment { id: string; contract_id: string; month_label: string; due_date: string; amount: number; currency: string; payment_status: string; paid_at: string | null }
interface Payment { id: string; contract_id: string | null; amount: number; currency: string; status: string; hosted_invoice_url: string | null; invoice_pdf_url: string | null; period_start: string | null; paid_at: string | null; created_at: string }
interface Invoice { id: string; invoice_number: string; issue_date: string; due_date: string; total_amount: number; currency: string; status: string; order_id: string | null; stripe_payment_link: string | null }
interface OrderLink { id: string; order_id: string; title: string; description: string | null; total_amount: number; currency: string; vat_enabled: boolean; vat_rate: number; url: string | null; status: string; paid_at: string | null; created_at: string }
interface Overview { contracts: Contract[]; installments: Installment[]; payments: Payment[]; invoices: Invoice[]; order_links?: OrderLink[] }

const money = (v: number, c = "EUR") => new Intl.NumberFormat("de-DE", { style: "currency", currency: (c || "EUR").toUpperCase() }).format(Number(v || 0));
const day = (d: string | null) => (d ? new Date(d).toLocaleDateString("de-DE") : "–");
const gross = (c: Contract) => {
  const r = Number(c.vat_rate ?? 0); const f = r > 1 ? r / 100 : r;
  return Number(c.monthly_amount) * (c.vat_enabled ? 1 + f : 1);
};

const ClientInvoices = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [params] = useSearchParams();
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try { setData(await stripeBilling<Overview>("overview")); }
    catch { toast({ title: t("billing.error"), variant: "destructive" }); }
    finally { setLoading(false); }
  }, [t, toast]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const s = params.get("stripe");
    if (s === "success") toast({ title: t("billing.success") });
    if (s === "cancelled") toast({ title: t("billing.cancelledCheckout") });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const act = async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    try { await fn(); } catch { toast({ title: t("billing.error"), variant: "destructive" }); } finally { setBusy(null); }
  };
  const pay = (id: string) => act(`pay-${id}`, async () => { const r = await stripeBilling("pay", { contract_id: id }); if (r.url) window.location.href = r.url; });
  const portal = () => act("portal", async () => { const r = await stripeBilling("portal"); if (r.url) window.location.href = r.url; });
  const cancel = (id: string) => act(`cancel-${id}`, async () => { await stripeBilling("cancel", { contract_id: id }); await load(); });

  const period = (f: number) => (f === 12 ? t("billing.year") : f > 1 ? t("billing.months", { n: String(f) }) : t("billing.month"));
  const statusOf = (c: Contract): { label: string; variant: "default" | "secondary" | "destructive" | "outline" } => {
    if (c.payment_method === "stripe") {
      if (c.cancel_at && c.stripe_status !== "canceled") return { label: t("billing.status.cancels", { date: day(c.cancel_at) }), variant: "secondary" };
      if (c.stripe_status === "active" || c.stripe_status === "trialing") return { label: t("billing.status.active"), variant: "default" };
      if (c.stripe_status === "past_due" || c.stripe_status === "unpaid") return { label: t("billing.status.failed"), variant: "destructive" };
      if (c.stripe_status === "canceled") return { label: t("billing.status.cancelled"), variant: "outline" };
      return { label: t("billing.status.pending"), variant: "secondary" };
    }
    if (c.status === "stopped") return { label: t("billing.status.stopped"), variant: "outline" };
    if (c.status === "completed") return { label: t("billing.status.completed"), variant: "outline" };
    return { label: t("billing.status.bank"), variant: "outline" };
  };
  const payBadge = (s: string) => (s === "paid" ? <Badge>{t("billing.paid")}</Badge> : s === "failed" ? <Badge variant="destructive">{t("billing.failed")}</Badge> : <Badge variant="secondary">{t("billing.open")}</Badge>);

  return (
    <ClientLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t("invoices.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("invoices.subtitle")}</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : (
          <>
            <Card>
              <CardHeader><CardTitle>{t("billing.subscriptions")}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {!data?.contracts.length && <p className="text-muted-foreground">{t("billing.noPackages")}</p>}
                {data?.contracts.map((c) => {
                  const st = statusOf(c);
                  const live = ["active", "trialing", "past_due", "unpaid"].includes(c.stripe_status ?? "");
                  const periods = data.installments.filter((i) => i.contract_id === c.id);
                  return (
                    <div key={c.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-foreground">{c.website || c.client_name}</p>
                          <p className="text-sm text-muted-foreground">{money(gross(c), c.currency)} {t("billing.perPeriod", { period: period(c.billing_frequency) })}</p>
                          {live && c.current_period_end && !c.cancel_at && (
                            <p className="text-xs text-muted-foreground">{t("billing.nextCharge", { date: day(c.current_period_end) })}</p>
                          )}
                        </div>
                        <Badge variant={st.variant}>{st.label}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {c.payment_method === "stripe" && !live && c.status === "active" && (
                          <Button size="sm" onClick={() => pay(c.id)} disabled={!!busy}>
                            {busy === `pay-${c.id}` ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CreditCard className="h-4 w-4 mr-2" />}
                            {t("billing.subscribe")}
                          </Button>
                        )}
                        {live && (
                          <Button size="sm" variant="outline" onClick={portal} disabled={!!busy}>
                            <CreditCard className="h-4 w-4 mr-2" />{t("billing.manageCard")}
                          </Button>
                        )}
                        {live && !c.cancel_at && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="ghost" disabled={!!busy}>{t("billing.cancel")}</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{t("billing.cancelTitle")}</AlertDialogTitle>
                                <AlertDialogDescription>{t("billing.cancelDesc")}</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t("billing.keep")}</AlertDialogCancel>
                                <AlertDialogAction onClick={() => cancel(c.id)}>{t("billing.confirmCancel")}</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                      {periods.length > 0 && (
                        <details className="text-sm">
                          <summary className="cursor-pointer text-muted-foreground">{t("billing.installments")} ({periods.length})</summary>
                          <ul className="mt-2 divide-y">
                            {periods.map((i) => (
                              <li key={i.id} className="flex justify-between py-1.5">
                                <span>{i.month_label}</span>
                                <span className="flex items-center gap-2">{money(i.amount, i.currency)} {payBadge(i.payment_status)}</span>
                              </li>
                            ))}
                          </ul>
                        </details>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" />{t("billing.openPayments")}</CardTitle></CardHeader>
              <CardContent>
                {!data?.order_links?.some((l) => l.status === "pending") ? <p className="text-muted-foreground">{t("billing.noOpenPayments")}</p> : (
                  <ul className="divide-y">
                    {data.order_links.filter((l) => l.status === "pending").map((l) => (
                      <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                        <div>
                          <p className="font-medium text-foreground">{l.title}</p>
                          {l.description && <p className="text-xs text-muted-foreground">{l.description}</p>}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{money(l.total_amount, l.currency)}</span>
                          {payBadge("open")}
                          {l.url && <Button size="sm" asChild><a href={l.url} target="_blank" rel="noopener noreferrer">{t("billing.payNow")}</a></Button>}
                          <Button size="sm" variant="ghost" asChild><Link to={`/client/orders/${l.order_id}`}>{t("billing.viewOrder")}</Link></Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />{t("billing.invoices")}</CardTitle></CardHeader>
              <CardContent>
                {!data?.invoices.length ? <p className="text-muted-foreground">{t("billing.noInvoices")}</p> : (
                  <ul className="divide-y">
                    {data.invoices.map((inv) => (
                      <li key={inv.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                        <div>
                          <p className="font-medium text-foreground">{inv.invoice_number}</p>
                          <p className="text-xs text-muted-foreground">{day(inv.issue_date)}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{money(inv.total_amount, inv.currency)}</span>
                          {payBadge(inv.status === "paid" ? "paid" : "open")}
                          {inv.status !== "paid" && inv.stripe_payment_link && (
                            <Button size="sm" asChild><a href={inv.stripe_payment_link} target="_blank" rel="noopener noreferrer">{t("billing.payNow")}</a></Button>
                          )}
                          {inv.order_id && (
                            <Button size="sm" variant="ghost" asChild><Link to={`/client/orders/${inv.order_id}`}>{t("billing.viewOrder")}</Link></Button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Receipt className="h-5 w-5" />{t("billing.payments")}</CardTitle></CardHeader>
              <CardContent>
                {!data?.payments.length ? <p className="text-muted-foreground">{t("billing.noPayments")}</p> : (
                  <ul className="divide-y">
                    {data.payments.map((p) => (
                      <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                        <span className="text-sm">{day(p.paid_at || p.created_at)}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{money(p.amount, p.currency)}</span>
                          {payBadge(p.status)}
                          {p.hosted_invoice_url && (
                            <Button size="sm" variant={p.status === "failed" ? "default" : "ghost"} asChild>
                              <a href={p.hosted_invoice_url} target="_blank" rel="noopener noreferrer">
                                {p.status === "failed" ? t("billing.payNow") : t("billing.receipt")} <ExternalLink className="h-3 w-3 ml-1" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </ClientLayout>
  );
};

export default ClientInvoices;
