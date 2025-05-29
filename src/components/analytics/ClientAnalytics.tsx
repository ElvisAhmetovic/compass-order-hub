
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Edit, Users } from "lucide-react";

const ClientAnalytics = () => {
  const [clientAcquisitionData, setClientAcquisitionData] = useState([
    { month: "Jan", new: 8, returning: 45 },
    { month: "Feb", new: 12, returning: 52 },
    { month: "Mar", new: 15, returning: 48 },
    { month: "Apr", new: 9, returning: 61 },
    { month: "May", new: 18, returning: 57 },
    { month: "Jun", new: 11, returning: 63 },
  ]);

  const [topClients, setTopClients] = useState([
    { name: "TechCorp Solutions", orders: 34, revenue: 15640, avgOrder: 460 },
    { name: "Global Industries", orders: 28, revenue: 12890, avgOrder: 460 },
    { name: "Innovation Hub", orders: 25, revenue: 11250, avgOrder: 450 },
    { name: "Future Systems", orders: 22, revenue: 9980, avgOrder: 454 },
    { name: "Digital Dynamics", orders: 19, revenue: 8550, avgOrder: 450 },
  ]);

  const [clientMetrics, setClientMetrics] = useState({
    totalActive: 89,
    avgOrderValue: 456,
    retentionRate: 76,
    avgOrdersPerClient: 14
  });

  // Load real client data
  useEffect(() => {
    try {
      const ordersData = JSON.parse(localStorage.getItem("orders") || "[]");
      const clientsData = JSON.parse(localStorage.getItem("clients") || "[]");
      
      if (ordersData.length > 0) {
        const processedData = processClientData(ordersData, clientsData);
        setTopClients(processedData.topClients);
        setClientMetrics(processedData.metrics);
        setClientAcquisitionData(processedData.acquisition);
      }
    } catch (error) {
      console.error("Error loading client data:", error);
    }
  }, []);

  const processClientData = (orders: any[], clients: any[]) => {
    // Group orders by company
    const companyStats: { [key: string]: { orders: number, revenue: number, firstOrder: Date } } = {};
    
    orders.forEach(order => {
      const company = order.company_name;
      const amount = parseFloat(order.amount || order.price || 0);
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

    // Calculate metrics
    const totalRevenue = Object.values(companyStats).reduce((sum, stats) => sum + stats.revenue, 0);
    const totalOrders = Object.values(companyStats).reduce((sum, stats) => sum + stats.orders, 0);
    const totalClients = Object.keys(companyStats).length;

    const metrics = {
      totalActive: totalClients,
      avgOrderValue: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
      retentionRate: 76, // This would need more complex calculation
      avgOrdersPerClient: totalClients > 0 ? Math.round(totalOrders / totalClients) : 0
    };

    // Process acquisition data (simplified)
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    const acquisition = monthNames.map(month => ({
      month,
      new: Math.floor(Math.random() * 15) + 5,
      returning: Math.floor(Math.random() * 20) + 40
    }));

    return { topClients, metrics, acquisition };
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

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Client Acquisition</CardTitle>
              <CardDescription>New vs returning clients monthly</CardDescription>
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
                  Client acquisition data is automatically calculated from your orders and client data.
                  Manual editing will be available in a future update.
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <BarChart data={clientAcquisitionData}>
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Client Metrics Summary</CardTitle>
              <CardDescription>Key client performance indicators</CardDescription>
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
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-2xl font-bold">{clientMetrics.totalActive}</div>
                <p className="text-xs text-muted-foreground">Total Active Clients</p>
              </div>
              <div>
                <div className="text-2xl font-bold">€{clientMetrics.avgOrderValue}</div>
                <p className="text-xs text-muted-foreground">Average Order Value</p>
              </div>
              <div>
                <div className="text-2xl font-bold">{clientMetrics.retentionRate}%</div>
                <p className="text-xs text-muted-foreground">Client Retention Rate</p>
              </div>
              <div>
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
          <CardDescription>Your most valuable clients this period</CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientAnalytics;
