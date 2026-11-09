import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import ClientLayout from "@/components/client-portal/ClientLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, ArrowLeft, CheckCircle, Clock, FileText, XCircle, Paperclip, Download, ExternalLink, Megaphone, AlertTriangle, CreditCard } from "lucide-react";
import { fetchClientOrderById, getOrderAttachments, ClientOrder, OrderAttachment } from "@/services/clientOrderService";
import { format } from "date-fns";
import { getClientStatusFromOrder, getClientStatusStep, getActionButtonConfig } from "@/utils/clientStatusTranslator";
import { useClientOrdersRealtime } from "@/hooks/useClientOrdersRealtime";
import { useLanguage } from "@/context/ClientLanguageContext";
import LoadErrorCard from "@/components/client-portal/LoadErrorCard";
import { useBillingOverview } from "@/components/client-portal/billing/useBillingOverview";
import { InvoiceRow, OpenLinkRow, PaymentRow } from "@/components/client-portal/billing/BillingParts";
import { dateLocale, money } from "@/components/client-portal/billing/billingFormat";

const ClientOrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<ClientOrder | null>(null);
  const [attachments, setAttachments] = useState<OrderAttachment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [attachmentsError, setAttachmentsError] = useState(false);
  const { t, language } = useLanguage();
  const locale = dateLocale(language);
  const billing = useBillingOverview(id);

  const loadOrder = useCallback(async () => {
    if (!id) return;
    setLoadError(false);
    setAttachmentsError(false);
    try {
      const [orderData, attachmentData] = await Promise.all([
        fetchClientOrderById(id),
        getOrderAttachments(id).catch((e) => {
          console.error("Attachments failed to load:", e);
          setAttachmentsError(true);
          return [] as OrderAttachment[];
        }),
      ]);
      setOrder(orderData);
      setAttachments(attachmentData);
    } catch (error) {
      console.error("Error loading order:", error);
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  const reloadBilling = billing.reload;
  useClientOrdersRealtime({
    orderId: id,
    onOrderUpdate: () => {
      loadOrder();
      reloadBilling();
    },
    showToast: true,
  });

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  if (isLoading) {
    return (
      <ClientLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ClientLayout>
    );
  }

  if (loadError) {
    return (
      <ClientLayout>
        <div className="space-y-4">
          <Button asChild variant="ghost">
            <Link to="/client/orders">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('orderDetail.backToOrders')}
            </Link>
          </Button>
          <LoadErrorCard onRetry={loadOrder} message={t('common.errorLoadingOrder')} />
        </div>
      </ClientLayout>
    );
  }

  if (!order) {
    return (
      <ClientLayout>
        <div className="space-y-4">
          <Button asChild variant="ghost">
            <Link to="/client/orders">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('orderDetail.backToOrders')}
            </Link>
          </Button>
          <Card className="border-dashed">
            <CardContent className="py-12 text-center text-muted-foreground">
              {t('orderDetail.notFound')}
            </CardContent>
          </Card>
        </div>
      </ClientLayout>
    );
  }

  const statusConfig = getClientStatusFromOrder(order, t);
  const actionConfig = getActionButtonConfig(order, t);
  const isCancelled = order.status_cancelled;

  const statusSteps = [
    { ...getClientStatusStep("created", !!order.status_created, t), icon: Clock },
    { ...getClientStatusStep("in_progress", !!order.status_in_progress, t), icon: Clock },
    { ...getClientStatusStep("invoice_sent", !!order.status_invoice_sent, t), icon: FileText },
    { ...getClientStatusStep("invoice_paid", !!order.status_invoice_paid, t), icon: CheckCircle },
    { ...getClientStatusStep("resolved", !!order.status_resolved, t), icon: CheckCircle },
  ];

  return (
    <ClientLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <Button asChild variant="ghost" size="sm">
            <Link to="/client/orders">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('orderDetail.back')}
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-foreground">{t('orderDetail.title')}</h1>
        </div>

        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6 min-w-0">
            {actionConfig.showButton && actionConfig.url && (
              <Card className="border-destructive/50 bg-destructive/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                    {t('orderDetail.actionRequired')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-foreground">
                    {t('orderDetail.actionDesc')}
                  </p>
                  <Button
                    asChild
                    variant="destructive"
                    size="lg"
                    className="w-full sm:w-auto"
                  >
                    <a 
                      href={actionConfig.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      {actionConfig.label}
                    </a>
                  </Button>
                  <p className="text-xs text-muted-foreground break-all">
                    {t('orderDetail.opens')}: {actionConfig.url}
                  </p>
                </CardContent>
              </Card>
            )}
            
            {order.client_visible_update && (
              <Card className="border-primary/30 bg-primary/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2 text-primary">
                    <Megaphone className="h-5 w-5" />
                    {t('orderDetail.latestUpdate')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                    {order.client_visible_update}
                  </p>
                  {order.updated_at && (
                    <p className="text-xs text-muted-foreground mt-3">
                      {t('orderDetail.lastUpdated')}: {format(new Date(order.updated_at), "PPP p", { locale })}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="break-words min-w-0">{order.company_name}</CardTitle>
                  <Badge 
                    variant={statusConfig.badgeVariant}
                    className={statusConfig.badgeClassName}
                  >
                    {statusConfig.emoji} {statusConfig.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {order.description && (
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">{t('orderDetail.description')}</h3>
                    <p className="text-foreground">{order.description}</p>
                  </div>
                )}
                
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">{t('orderDetail.created')}</h3>
                    <p>{format(new Date(order.created_at), "PPP", { locale })}</p>
                  </div>
                  {order.updated_at && (
                    <div>
                      <h3 className="font-medium text-sm text-muted-foreground mb-1">{t('orderDetail.lastUpdatedLabel')}</h3>
                      <p>{format(new Date(order.updated_at), "PPP", { locale })}</p>
                    </div>
                  )}
                  {order.price && (
                    <div>
                      <h3 className="font-medium text-sm text-muted-foreground mb-1">{t('orderDetail.price')}</h3>
                      <p className="text-lg font-semibold">
                        {money(order.price, order.currency || "EUR")}
                      </p>
                    </div>
                  )}
                  {order.priority && (
                    <div>
                      <h3 className="font-medium text-sm text-muted-foreground mb-1">{t('orderDetail.priority')}</h3>
                      <Badge variant="outline">{order.priority}</Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('orderDetail.orderProgress')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isCancelled && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{t('orderDetail.overallProgress')}</span>
                      <span className="font-medium text-foreground">{statusConfig.progress}%</span>
                    </div>
                    <Progress value={statusConfig.progress} className="h-3" />
                    <p className="text-sm text-muted-foreground">
                      {t('orderDetail.currentStatus')}: <span className="font-medium text-foreground">{statusConfig.emoji} {statusConfig.label}</span>
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap gap-3 pt-2">
                  {statusSteps.map((step) => (
                    <div
                      key={step.key}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                        step.active
                          ? "bg-primary/10 border-primary text-foreground"
                          : "bg-muted/50 border-border text-muted-foreground"
                      }`}
                    >
                      <step.icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{step.label}</span>
                      {step.active && <CheckCircle className="h-4 w-4 text-primary" />}
                    </div>
                  ))}
                  {order.status_cancelled && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-destructive bg-destructive/10 text-destructive">
                      <XCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">{t('orderDetail.cancelled')}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card data-testid="order-payments">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  {t('orderDetail.payments')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {billing.loading && !billing.data ? (
                  <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                ) : billing.error || !billing.data ? (
                  <LoadErrorCard compact onRetry={billing.reload} message={t('billing.loadFailed')} />
                ) : (() => {
                  const links = billing.data.order_links.filter((l) => l.status === "pending");
                  const { invoices, payments } = billing.data;
                  if (!links.length && !invoices.length && !payments.length) {
                    return <p className="text-sm text-muted-foreground">{t('orderDetail.noPayments')}</p>;
                  }
                  return (
                    <>
                      {links.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-foreground">{t('billing.openPayments')}</p>
                          <ul className="divide-y">{links.map((l) => <OpenLinkRow key={l.id} link={l} showOrder={false} />)}</ul>
                        </div>
                      )}
                      {invoices.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-foreground">{t('billing.invoices')}</p>
                          <ul className="divide-y">{invoices.map((i) => <InvoiceRow key={i.id} inv={i} showOrder={false} />)}</ul>
                        </div>
                      )}
                      {payments.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-foreground">{t('billing.payments')}</p>
                          <ul className="divide-y">{payments.map((p) => <PaymentRow key={p.id} p={p} />)}</ul>
                        </div>
                      )}
                    </>
                  );
                })()}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Paperclip className="h-5 w-5" />
                  {t('orderDetail.attachments')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {attachmentsError ? (
                  <LoadErrorCard compact onRetry={loadOrder} />
                ) : attachments.length > 0 ? (
                  <div className="space-y-2">
                    {attachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="font-medium text-sm text-foreground truncate">{attachment.file_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {attachment.file_size ? `${(attachment.file_size / 1024).toFixed(1)} KB` : t('orderDetail.unknownSize')} 
                              {' • '}{format(new Date(attachment.created_at), "PP", { locale })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                            <a href={attachment.file_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                          <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                            <a href={attachment.file_url} download={attachment.file_name}>
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    <Paperclip className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">{t('orderDetail.noAttachments')}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('orderDetail.contactInfo')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {order.contact_email && (
                  <div>
                    <span className="text-muted-foreground">{t('orderDetail.emailLabel')}</span>
                    <p className="font-medium">{order.contact_email}</p>
                  </div>
                )}
                {order.contact_phone && (
                  <div>
                    <span className="text-muted-foreground">{t('orderDetail.phoneLabel')}</span>
                    <p className="font-medium">{order.contact_phone}</p>
                  </div>
                )}
                {order.company_email && (
                  <div>
                    <span className="text-muted-foreground">{t('orderDetail.companyEmail')}</span>
                    <p className="font-medium">{order.company_email}</p>
                  </div>
                )}
                {!order.contact_email && !order.contact_phone && !order.company_email && (
                  <p className="text-muted-foreground">{t('orderDetail.noContact')}</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ClientLayout>
  );
};

export default ClientOrderDetail;
