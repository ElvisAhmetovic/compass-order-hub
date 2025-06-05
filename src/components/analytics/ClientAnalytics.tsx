
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Edit, Users } from "lucide-react";
import { OrderService } from "@/services/orderService";
import { Order } from "@/types";

const ClientAnalytics = () => {
  const [clientAcquisitionData, setClientAcquisitionData] = useState([
    { month: "Jan", new: 0, returning: 0 },
    { month: "Feb", new: 0, returning: 0 },
    { month: "Mar", new: 0, returning: 0 },
    { month: "Apr", new: 0, returning: 0 },
    { month: "May", new: 0, returning: 0 },
    { month: "Jun", new: 0, returning: 0 },
  ]);

  const [topClients, setTopClients] = useState([
    { name: "No clients yet", orders: 0, revenue: 0, avgOrder: 0 },
  ]);

  const [clientMetrics, setClientMetrics] = useState({
    totalActive: 0,
    avgOrderValue: 0,
    retentionRate: 0,
    avgOrdersPerClient: 0
  });

  const [loading, setLoading] = useState(true);

  // Load real client data from Supabase
  useEffect(() => {
    const fetchClientData = async () => {
      try {
        setLoading(true);
        const orders = await OrderService.getOrders();
        
        if (orders.length > 0) {
          const processedData = processClientData(orders);
          setTopClients(processedData.topClients);
          setClientMetrics(processedData.metrics);
          setClientAcquisitionData(processedData.acquisition);
        }
      } catch (error) {
        console.error("Error loading client data for analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClientData();

    // Listen for order changes to refresh data
    const handleOrderStatusChange = () => {
      console.log('Order status change detected in ClientAnalytics, refreshing data...');
      fetchClientData();
    };

    window.addEventListener('orderStatusChanged', handleOrderStatusChange);
    
    return () => {
      window.removeEventListener('orderStatusChanged', handleOrderStatusChange);
    };
  }, []);

  const processClientData = (orders: Order[]) => {
    // Group orders by company
    const companyStats: { [key: string]: { orders: number, revenue: number, firstOrder: Date } } = {};
    
    orders.forEach(order => {
      const company = order.company_name;
      const amount = parseFloat(order.price?.toString() || '0');
      const orderDate = new Date(order.created_at);
      
      if (!companyStats[company]) {
        companyStats[company] = { orders: 0, revenue: 0, firstOrder: orderDate };
      }
      
      companyStats[company].orders++;
      companyStats[company].revenue += amount;
      
      if (orderDate < companyStats[company].firstOrder) {
        companyStats[company].firstOrder = orderDate;
      }
    });

    // Calculate top clients
    const topClients = Object.entries(companyStats)
      .map(([name, stats]) => ({
        name,
        orders: stats.orders,
        revenue: Math.round(stats.revenue),
        avgOrder: Math.round(stats.revenue / stats.orders)
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // If no clients, show default message
    if (topClients.length === 0) {
      topClients.push({ name: "No clients yet", orders: 0, revenue: 0, avgOrder: 0 });
    }

    // Calculate metrics
    const totalRevenue = Object.values(companyStats).reduce((sum, stats) => sum + stats.revenue, 0);
    const totalOrders = Object.values(companyStats).reduce((sum, stats) => sum + stats.orders, 0);
    const totalClients = Object.keys(companyStats).length;

    const metrics = {
      totalActive: totalClients,
      avgOrderValue: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
      retentionRate: calculateRetentionRate(orders),
      avgOrdersPerClient: totalClients > 0 ? Math.round(totalOrders / totalClients) : 0
    };

    // Process acquisition data based on actual orders
    const acquisition = processAcquisitionData(orders);

    return { topClients, metrics, acquisition };
  };

  const calculateRetentionRate = (orders: Order[]) => {
    const clientOrderCounts: { [key: string]: number } = {};
    
    orders.forEach(order => {
      const company = order.company_name;
      clientOrderCounts[company] = (clientOrderCounts[company] || 0) + 1;
    });
    
    const totalClients = Object.keys(clientOrderCounts).length;
    const returningClients = Object.values(clientOrderCounts).filter(count => count > 1).length;
    
    return totalClients > 0 ? Math.round((returningClients / totalClients) * 100) : 0;
  };

  const processAcquisitionData = (orders: Order[]) => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyClientData: { [key: string]: { new: Set<string>, returning: Set<string> } } = {};
    const allTimeClients = new Set<string>();
    
    // Initialize months
    monthNames.forEach(month => {
      monthlyClientData[month] = { new: new Set(), returning: new Set() };
    });
    
    // Sort orders by date
    const sortedOrders = orders.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    
    // Process orders chronologically
    sortedOrders.forEach(order => {
      const date = new Date(order.created_at);
      const monthKey = monthNames[date.getMonth()];
      const company = order.company_name;
      
      if (allTimeClients.has(company)) {
        monthlyClientData[monthKey].returning.add(company);
      } else {
        monthlyClientData[monthKey].new.add(company);
        allTimeClients.add(company);
      }
    });

    return monthNames.map(month => ({
      month,
      new: monthlyClientData[month].new.size,
      returning: monthlyClientData[month].returning.size,
    })).slice(0, 6);
  };

  const chartConfig = {
    new: {
      label: "New Clients",
      color: "#22c55e",
    },
    returning: {
      label: "Returning Clients",
      color: "#3b82f6",
    },
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-6 bg-gray-200 rounded mb-4"></div>
                  <div className="h-[300px] bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-lg">Client Acquisition</CardTitle>
              <CardDescription>New vs returning clients monthly from live data</CardDescription>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Client Acquisition Data</DialogTitle>
                </DialogHeader>
                <div className="text-sm text-gray-500">
                  Client acquisition data is automatically calculated from your live orders data.
                  Manual editing will be available in a future update.
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="pt-2">
            <ChartContainer config={chartConfig} className="h-[280px] w-full">
              <BarChart data={clientAcquisitionData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="new" fill="var(--color-new)" />
                <Bar dataKey="returning" fill="var(--color-returning)" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-lg">Client Metrics Summary</CardTitle>
              <CardDescription>Key client performance indicators from live data</CardDescription>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Users className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Client Metrics Details</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 border rounded">
                      <div className="text-2xl font-bold">{clientMetrics.totalActive}</div>
                      <p className="text-sm text-gray-500">Total Active Clients</p>
                    </div>
                    <div className="text-center p-4 border rounded">
                      <div className="text-2xl font-bold">€{clientMetrics.avgOrderValue}</div>
                      <p className="text-sm text-gray-500">Average Order Value</p>
                    </div>
                    <div className="text-center p-4 border rounded">
                      <div className="text-2xl font-bold">{clientMetrics.retentionRate}%</div>
                      <p className="text-sm text-gray-500">Client Retention Rate</p>
                    </div>
                    <div className="text-center p-4 border rounded">
                      <div className="text-2xl font-bold">{clientMetrics.avgOrdersPerClient}</div>
                      <p className="text-sm text-gray-500">Avg Orders per Client</p>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{clientMetrics.totalActive}</div>
                <p className="text-xs text-muted-foreground">Total Active Clients</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">€{clientMetrics.avgOrderValue}</div>
                <p className="text-xs text-muted-foreground">Average Order Value</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{clientMetrics.retentionRate}%</div>
                <p className="text-xs text-muted-foreground">Client Retention Rate</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{clientMetrics.avgOrdersPerClient}</div>
                <p className="text-xs text-muted-foreground">Avg Orders per Client</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Clients by Revenue</CardTitle>
          <CardDescription>Your most valuable clients based on live data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client Name</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Avg Order Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topClients.map((client, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell className="text-right">{client.orders}</TableCell>
                    <TableCell className="text-right">€{client.revenue.toLocaleString()}</TableCell>
                    <TableCell className="text-right">€{client.avgOrder}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientAnalytics;
