import { useEffect, useState } from "react";
import ClientLayout from "@/components/client-portal/ClientLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Clock, FileText, CheckCircle, Loader2 } from "lucide-react";
import { getClientOrderStats, getClientCompany } from "@/services/clientOrderService";
import { useToast } from "@/hooks/use-toast";

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
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [orderStats, companyData] = await Promise.all([
          getClientOrderStats(),
          getClientCompany()
        ]);
        setStats(orderStats);
        setCompany(companyData);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load dashboard data"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [toast]);

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
    { title: "Total Orders", value: stats?.total || 0, icon: Package, color: "text-blue-500" },
    { title: "In Progress", value: stats?.inProgress || 0, icon: Clock, color: "text-yellow-500" },
    { title: "Invoice Sent", value: stats?.invoiceSent || 0, icon: FileText, color: "text-orange-500" },
    { title: "Completed", value: stats?.resolved || 0, icon: CheckCircle, color: "text-green-500" },
  ];

  return (
    <ClientLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome to your client portal
          </p>
        </div>

        {company && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Company Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 text-sm">
                <div><span className="font-medium">Name:</span> {company.name}</div>
                <div><span className="font-medium">Email:</span> {company.email}</div>
                {company.phone && <div><span className="font-medium">Phone:</span> {company.phone}</div>}
                {company.address && <div><span className="font-medium">Address:</span> {company.address}</div>}
                <div><span className="font-medium">Contact:</span> {company.contact_person}</div>
              </div>
            </CardContent>
          </Card>
        )}

        {!company && (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center text-muted-foreground">
              <p>No company linked to your account yet.</p>
              <p className="text-sm mt-1">Please contact support to link your company.</p>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </ClientLayout>
  );
};

export default ClientDashboard;
