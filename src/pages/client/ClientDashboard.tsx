import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import ClientLayout from "@/components/client-portal/ClientLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Clock, FileText, CheckCircle, Loader2, ArrowRight, User, Building2, CreditCard } from "lucide-react";
import { orderStatsFrom, getClientCompany, fetchClientOrders, ClientOrder } from "@/services/clientOrderService";
import LoadErrorCard from "@/components/client-portal/LoadErrorCard";
import { useBillingOverview, grossAmount } from "@/components/client-portal/billing/useBillingOverview";
import { InvoiceRow, OpenLinkRow, useContractStatus } from "@/components/client-portal/billing/BillingParts";
import { money } from "@/components/client-portal/billing/billingFormat";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import ClientOrderCard from "@/components/client-portal/ClientOrderCard";
import { useClientOrdersRealtime } from "@/hooks/useClientOrdersRealtime";
import { useLanguage } from "@/context/ClientLanguageContext";

interface OrderStats {
  total: number;
  inProgress: number;
  invoiceSent: number;
  invoicePaid: number;
  resolved: number;
}

interface Company {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  contact_person: string;
}

const ClientDashboard = () => {
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [recentOrders, setRecentOrders] = useState<ClientOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const { user } = useAuth();
  const { t } = useLanguage();
  const billing = useBillingOverview();
  const contractStatus = useContractStatus();

  const loadData = useCallback(async () => {
    setLoadError(false);
    try {
      // Orders are fetched once; counts and the recent list come from the same result.
      const [orders, companyData] = await Promise.all([fetchClientOrders(), getClientCompany()]);
      setStats(orderStatsFrom(orders));
      setCompany(companyData);
      setRecentOrders(orders.slice(0, 5));
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reloadBilling = billing.reload;
  useClientOrdersRealtime({
    onOrderUpdate: () => {
      loadData();
      reloadBilling();
    },
    showToast: true,
  });

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading) {
    return (
      <ClientLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ClientLayout>
    );
  }

  const statCards = [
    { title: t('dashboard.totalOrders'), value: stats?.total || 0, icon: Package, color: "text-blue-500", bgColor: "bg-blue-500/10" },
    { title: t('dashboard.inProgress'), value: stats?.inProgress || 0, icon: Clock, color: "text-yellow-500", bgColor: "bg-yellow-500/10" },
    { title: t('dashboard.invoiceSent'), value: stats?.invoiceSent || 0, icon: FileText, color: "text-orange-500", bgColor: "bg-orange-500/10" },
    { title: t('dashboard.completed'), value: stats?.resolved || 0, icon: CheckCircle, color: "text-green-500", bgColor: "bg-green-500/10" },
  ];

  return (
    <ClientLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            {t('dashboard.welcome', { name: user?.first_name ? `, ${user.first_name}` : '' })}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            {t('dashboard.subtitle')}
          </p>
        </div>

        {loadError && <LoadErrorCard onRetry={loadData} message={t('common.errorLoadingData')} />}

        <Card data-testid="dashboard-billing">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                {t('dashboard.payments')}
              </CardTitle>
              <Button asChild variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                <Link to="/client/invoices">{t('dashboard.allPayments')}<ArrowRight className="h-4 w-4 ml-1" /></Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {billing.loading && !billing.data ? (
              <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : billing.error || !billing.data ? (
              <LoadErrorCard compact onRetry={billing.reload} message={t('billing.loadFailed')} />
            ) : (() => {
              const links = billing.data?.order_links.filter((l) => l.status === "pending") ?? [];
              const openInvoices = billing.data.invoices.filter((i) => i.status !== "paid" && i.status !== "cancelled" && i.stripe_payment_link);
              const contracts = billing.data.contracts.filter((c) => c.status === "active" || ["active", "trialing", "past_due", "unpaid"].includes(c.stripe_status ?? ""));
              if (!links.length && !openInvoices.length && !contracts.length) {
                return <p className="text-sm text-muted-foreground">{t('dashboard.nothingToPay')}</p>;
              }
              return (
                <>
                  {(links.length > 0 || openInvoices.length > 0) && (
                    <div>
                      <p className="text-sm font-medium text-foreground">{t('billing.openPayments')}</p>
                      <ul className="divide-y">
                        {links.map((l) => <OpenLinkRow key={l.id} link={l} />)}
                        {openInvoices.map((i) => <InvoiceRow key={i.id} inv={i} />)}
                      </ul>
                    </div>
                  )}
                  {contracts.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-foreground mb-2">{t('billing.subscriptions')}</p>
                      <ul className="space-y-2">
                        {contracts.map((c) => {
                          const st = contractStatus(c);
                          return (
                            <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3">
                              <span className="font-medium text-foreground break-words">{c.website || c.client_name}</span>
                              <span className="flex items-center gap-2 text-sm">
                                {money(grossAmount(c), c.currency)}
                                <Badge variant={st.variant}>{st.label}</Badge>
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </>
              );
            })()}
          </CardContent>
        </Card>

        <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <Card key={stat.title} className="border-border/50">
              <CardContent className="p-3 md:p-5">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className={`p-2 md:p-3 rounded-xl ${stat.bgColor}`}>
                    <stat.icon className={`h-5 w-5 md:h-6 md:w-6 ${stat.color}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs md:text-sm text-muted-foreground truncate">{stat.title}</p>
                    <p className="text-xl md:text-2xl font-bold text-foreground">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">{t('dashboard.recentOrders')}</h2>
              <Button asChild variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                <Link to="/client/orders">
                  {t('dashboard.viewAll')}
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>

            {recentOrders.length > 0 ? (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <ClientOrderCard key={order.id} order={order} />
                ))}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">{t('dashboard.noOrders')}</p>
                  <p className="text-sm mt-1">{t('dashboard.noOrdersDesc')}</p>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    {t('dashboard.quickProfile')}
                  </CardTitle>
                  <Button asChild variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                    <Link to="/client/settings">
                      {t('dashboard.edit')}
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-lg font-semibold text-primary">
                      {user?.first_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground truncate">
                      {user?.full_name || 'User'}
                    </p>
                    <p className="text-muted-foreground truncate text-xs">
                      {user?.email}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {company ? (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    {t('dashboard.company')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="space-y-2">
                    <div>
                      <span className="text-muted-foreground text-xs">{t('dashboard.name')}</span>
                      <p className="font-medium text-foreground">{company.name}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">{t('dashboard.email')}</span>
                      <p className="text-foreground">{company.email}</p>
                    </div>
                    {company.phone && (
                      <div>
                        <span className="text-muted-foreground text-xs">{t('dashboard.phone')}</span>
                        <p className="text-foreground">{company.phone}</p>
                      </div>
                    )}
                    {company.contact_person && (
                      <div>
                        <span className="text-muted-foreground text-xs">{t('dashboard.contact')}</span>
                        <p className="text-foreground">{company.contact_person}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center text-muted-foreground">
                  <Building2 className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">{t('dashboard.noCompany')}</p>
                  <p className="text-xs mt-1">{t('dashboard.noCompanyDesc')}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </ClientLayout>
  );
};

export default ClientDashboard;
