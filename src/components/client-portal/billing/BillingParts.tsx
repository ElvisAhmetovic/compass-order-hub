import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink } from "lucide-react";
import { useLanguage } from "@/context/ClientLanguageContext";
import { day, money } from "./billingFormat";
import { invoiceStatus, todayIso } from "./invoiceStatus";
import type { Contract, Invoice, OrderLink, Payment } from "./useBillingOverview";

type Variant = "default" | "secondary" | "destructive" | "outline";

export const PayBadge = ({ status }: { status: string }) => {
  const { t } = useLanguage();
  if (status === "paid") return <Badge>{t("billing.paid")}</Badge>;
  if (status === "failed") return <Badge variant="destructive">{t("billing.failed")}</Badge>;
  return <Badge variant="secondary">{t("billing.open")}</Badge>;
};

export function useContractStatus() {
  const { t, language } = useLanguage();
  return (c: Contract): { label: string; variant: Variant } => {
    if (c.payment_method === "stripe") {
      if (c.cancel_at && c.stripe_status !== "canceled") return { label: t("billing.status.cancels", { date: day(c.cancel_at, language) }), variant: "secondary" };
      if (c.stripe_status === "active" || c.stripe_status === "trialing") return { label: t("billing.status.active"), variant: "default" };
      if (c.stripe_status === "past_due" || c.stripe_status === "unpaid") return { label: t("billing.status.failed"), variant: "destructive" };
      if (c.stripe_status === "canceled") return { label: t("billing.status.cancelled"), variant: "outline" };
      return { label: t("billing.status.pending"), variant: "secondary" };
    }
    if (c.status === "stopped") return { label: t("billing.status.stopped"), variant: "outline" };
    if (c.status === "completed") return { label: t("billing.status.completed"), variant: "outline" };
    return { label: t("billing.status.bank"), variant: "outline" };
  };
}

export const OpenLinkRow = ({ link, showOrder = true }: { link: OrderLink; showOrder?: boolean }) => {
  const { t } = useLanguage();
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 py-3">
      <div className="min-w-0">
        <p className="font-medium text-foreground break-words">{link.title}</p>
        {link.description && <p className="text-xs text-muted-foreground break-words">{link.description}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">{money(link.total_amount, link.currency)}</span>
        <PayBadge status="open" />
        {link.url && <Button size="sm" asChild><a href={link.url} target="_blank" rel="noopener noreferrer">{t("billing.payNow")}</a></Button>}
        {showOrder && <Button size="sm" variant="ghost" asChild><Link to={`/client/orders/${link.order_id}`}>{t("billing.viewOrder")}</Link></Button>}
      </div>
    </li>
  );
};

export const InvoiceStatusBadge = ({ inv }: { inv: Invoice }) => {
  const { t } = useLanguage();
  const st = invoiceStatus(inv, todayIso());
  if (st === "paid") return <Badge className="bg-success text-success-foreground hover:bg-success">{t("billing.paid")}</Badge>;
  if (st === "overdue") return <Badge variant="destructive">{t("invoices.overdue")}</Badge>;
  if (st === "cancelled") return <Badge variant="outline">{t("invoices.cancelled")}</Badge>;
  return <Badge className="bg-warning text-warning-foreground hover:bg-warning">{t("invoices.unpaid")}</Badge>;
};

export const InvoiceRow = ({ inv, showOrder = true }: { inv: Invoice; showOrder?: boolean }) => {
  const { t, language } = useLanguage();
  const st = invoiceStatus(inv, todayIso());
  const open = st === "unpaid" || st === "overdue";
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 py-3" data-testid="invoice-row" data-status={st}>
      <div className="min-w-0">
        <p className="font-medium text-foreground">{inv.invoice_number}</p>
        <p className="text-xs text-muted-foreground">
          {day(inv.issue_date, language)}
          {st === "paid" && inv.paid_at && <> · {t("invoices.paidOn", { date: day(inv.paid_at, language) })}</>}
          {open && inv.due_date && <> · {t("invoices.dueOn", { date: day(inv.due_date, language) })}</>}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">{money(inv.total_amount, inv.currency)}</span>
        <InvoiceStatusBadge inv={inv} />
        {open && inv.stripe_payment_link && (
          <Button size="sm" asChild><a href={inv.stripe_payment_link} target="_blank" rel="noopener noreferrer">{t("billing.payNow")}</a></Button>
        )}
        {showOrder && inv.order_id && (
          <Button size="sm" variant="ghost" asChild><Link to={`/client/orders/${inv.order_id}`}>{t("billing.viewOrder")}</Link></Button>
        )}
      </div>
    </li>
  );
};

export const PaymentRow = ({ p }: { p: Payment }) => {
  const { t, language } = useLanguage();
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 py-3">
      <span className="text-sm">{day(p.paid_at || p.created_at, language)}</span>
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">{money(p.amount, p.currency)}</span>
        <PayBadge status={p.status} />
        {p.hosted_invoice_url && (
          <Button size="sm" variant={p.status === "failed" ? "default" : "ghost"} asChild>
            <a href={p.hosted_invoice_url} target="_blank" rel="noopener noreferrer">
              {p.status === "failed" ? t("billing.payNow") : t("billing.receipt")} <ExternalLink className="h-3 w-3 ml-1" />
            </a>
          </Button>
        )}
        {p.invoice_pdf_url && (
          <Button size="sm" variant="ghost" asChild>
            <a href={p.invoice_pdf_url} target="_blank" rel="noopener noreferrer">
              <Download className="h-3 w-3 mr-1" />{t("billing.downloadPdf")}
            </a>
          </Button>
        )}
      </div>
    </li>
  );
};
