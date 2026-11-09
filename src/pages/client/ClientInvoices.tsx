import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ClientLayout from "@/components/client-portal/ClientLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CreditCard, FileText, Loader2, Receipt } from "lucide-react";
import { useLanguage } from "@/context/ClientLanguageContext";
import { useToast } from "@/hooks/use-toast";
import { stripeBilling } from "@/services/stripeBillingService";
import LoadErrorCard from "@/components/client-portal/LoadErrorCard";
import { useBillingOverview, grossAmount as gross, type Contract } from "@/components/client-portal/billing/useBillingOverview";
import { InvoiceRow, OpenLinkRow, PayBadge, PaymentRow, useContractStatus } from "@/components/client-portal/billing/BillingParts";
import { day as fmtDay, money } from "@/components/client-portal/billing/billingFormat";

const ClientInvoices = () => {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [params] = useSearchParams();
  const { data, loading, error, reload: load } = useBillingOverview();
  const [busy, setBusy] = useState<string | null>(null);
  const day = (d: string | null) => fmtDay(d, language);
  const statusOf = useContractStatus();
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
  return (
    <ClientLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t("invoices.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("invoices.subtitle")}</p>
        </div>

        {loading && !data ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : error || !data ? (
          <LoadErrorCard onRetry={load} message={t("billing.loadFailed")} />
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
                                <span className="flex items-center gap-2">{money(i.amount, i.currency)} <PayBadge status={i.payment_status} /></span>
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
                    {data.order_links.filter((l) => l.status === "pending").map((l) => <OpenLinkRow key={l.id} link={l} />)}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />{t("billing.invoices")}</CardTitle></CardHeader>
              <CardContent>
                {!data?.invoices.length ? <p className="text-muted-foreground">{t("billing.noInvoices")}</p> : (
                  <ul className="divide-y">
                    {data.invoices.map((inv) => <InvoiceRow key={inv.id} inv={inv} />)}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Receipt className="h-5 w-5" />{t("billing.payments")}</CardTitle></CardHeader>
              <CardContent>
                {!data?.payments.length ? <p className="text-muted-foreground">{t("billing.noPayments")}</p> : (
                  <ul className="divide-y">
                    {data.payments.map((p) => <PaymentRow key={p.id} p={p} />)}
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
