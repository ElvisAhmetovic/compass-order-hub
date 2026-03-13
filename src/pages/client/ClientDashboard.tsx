import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import ClientLayout from "@/components/client-portal/ClientLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Clock, FileText, CheckCircle, Loader2, ArrowRight, User, Building2 } from "lucide-react";
import { getClientOrderStats, getClientCompany, fetchClientOrders, ClientOrder } from "@/services/clientOrderService";
import { useToast } from "@/hooks/use-toast";
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
  const { toast } = useToast();
  const { user } = useAuth();
  const { t } = useLanguage();

  const loadData = useCallback(async () => {
    try {
      const [orderStats, companyData, orders] = await Promise.all([
        getClientOrderStats(),
        getClientCompany(),
        fetchClientOrders()
      ]);
      setStats(orderStats);
      setCompany(companyData);
      setRecentOrders(orders.slice(0, 5));
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: t('common.errorLoadingData')
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, t]);

  const { isConnected } = useClientOrdersRealtime({
    onOrderUpdate: () => {
      loadData();
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
                    <Link to="/client/profile">
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
