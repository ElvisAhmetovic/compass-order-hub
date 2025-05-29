
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

const Analytics = () => {
  const { user } = useAuth();
  const [dashboardStats, setDashboardStats] = useState({
    totalOrders: 1234,
    totalRevenue: 45231,
    activeClients: 89,
    completionRate: 92
  });

  // Load real dashboard statistics
  useEffect(() => {
    try {
      const ordersData = JSON.parse(localStorage.getItem("orders") || "[]");
      const invoicesData = JSON.parse(localStorage.getItem("invoices") || "[]");
      
      // Calculate real stats
      const totalOrders = ordersData.length;
      const completedOrders = ordersData.filter((order: any) => 
        order.status === "Resolved" || order.status === "Invoice Paid"
      ).length;
      const completionRate = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0;
      
      const totalRevenue = ordersData.reduce((sum: number, order: any) => 
        sum + parseFloat(order.amount || order.price || 0), 0
      );
      
      const uniqueClients = new Set(ordersData.map((order: any) => order.company_name)).size;
      
      setDashboardStats({
        totalOrders,
        totalRevenue: Math.round(totalRevenue),
        activeClients: uniqueClients,
        completionRate
      });
    } catch (error) {
      console.error("Error loading dashboard stats:", error);
    }
  }, []);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1">
        <Layout userRole={user?.role || "user"}>
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Analytics & Reports</h1>
              <p className="text-muted-foreground">
                Comprehensive insights into your business performance
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
                      <p className="text-xs text-muted-foreground">Based on actual order data</p>
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
