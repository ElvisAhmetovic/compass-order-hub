
import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import Sidebar from "@/components/dashboard/Sidebar";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OrderAnalytics from "@/components/analytics/OrderAnalytics";
import RevenueAnalytics from "@/components/analytics/RevenueAnalytics";
import ClientAnalytics from "@/components/analytics/ClientAnalytics";
import PerformanceAnalytics from "@/components/analytics/PerformanceAnalytics";
import { OrderService } from "@/services/orderService";
import { Order } from "@/types";

const Analytics = () => {
  const { user } = useAuth();
  const [dashboardStats, setDashboardStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    activeClients: 0,
    completionRate: 0
  });
  const [loading, setLoading] = useState(true);

  // Load real dashboard statistics from Supabase
  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true);
        const orders = await OrderService.getOrders();
        
        // Calculate real stats
        const totalOrders = orders.length;
        const completedOrders = orders.filter((order: Order) => 
          order.status === "Resolved" || order.status === "Invoice Paid"
        ).length;
        const completionRate = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0;
        
        const totalRevenue = orders.reduce((sum: number, order: Order) => 
          sum + parseFloat(order.price?.toString() || '0'), 0
        );
        
        const uniqueClients = new Set(orders.map((order: Order) => order.company_name)).size;
        
        setDashboardStats({
          totalOrders,
          totalRevenue: Math.round(totalRevenue),
          activeClients: uniqueClients,
          completionRate
        });
      } catch (error) {
        console.error("Error loading dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();

    // Listen for order changes to refresh data
    const handleOrderStatusChange = () => {
      console.log('Order status change detected in Analytics, refreshing data...');
      fetchDashboardStats();
    };

    window.addEventListener('orderStatusChanged', handleOrderStatusChange);
    
    return () => {
      window.removeEventListener('orderStatusChanged', handleOrderStatusChange);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1">
          <Layout userRole={user?.role || "user"}>
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Analytics & Reports</h1>
                <p className="text-muted-foreground">Loading analytics data...</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="animate-pulse">
                        <div className="h-6 w-6 bg-gray-200 rounded mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </Layout>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1">
        <Layout userRole={user?.role || "user"}>
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Analytics & Reports</h1>
              <p className="text-muted-foreground">
                Real-time insights into your business performance
              </p>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="orders">Orders</TabsTrigger>
                <TabsTrigger value="revenue">Revenue</TabsTrigger>
                <TabsTrigger value="clients">Clients</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{dashboardStats.totalOrders.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground">Live data from Supabase</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">€{dashboardStats.totalRevenue.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground">From completed orders</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{dashboardStats.activeClients}</div>
                      <p className="text-xs text-muted-foreground">Unique companies</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{dashboardStats.completionRate}%</div>
                      <p className="text-xs text-muted-foreground">Orders completed successfully</p>
                    </CardContent>
                  </Card>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <OrderAnalytics />
                  <RevenueAnalytics />
                </div>
              </TabsContent>

              <TabsContent value="orders">
                <OrderAnalytics detailed />
              </TabsContent>

              <TabsContent value="revenue">
                <RevenueAnalytics detailed />
              </TabsContent>

              <TabsContent value="clients">
                <ClientAnalytics />
              </TabsContent>

              <TabsContent value="performance">
                <PerformanceAnalytics />
              </TabsContent>
            </Tabs>
          </div>
        </Layout>
      </div>
    </div>
  );
};

export default Analytics;
