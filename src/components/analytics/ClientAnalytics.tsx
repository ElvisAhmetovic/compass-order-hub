
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ScatterChart, Scatter } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const ClientAnalytics = () => {
  const clientAcquisitionData = [
    { month: "Jan", new: 8, returning: 45 },
    { month: "Feb", new: 12, returning: 52 },
    { month: "Mar", new: 15, returning: 48 },
    { month: "Apr", new: 9, returning: 61 },
    { month: "May", new: 18, returning: 57 },
    { month: "Jun", new: 11, returning: 63 },
  ];

  const topClients = [
    { name: "TechCorp Solutions", orders: 34, revenue: 15640, avgOrder: 460 },
    { name: "Global Industries", orders: 28, revenue: 12890, avgOrder: 460 },
    { name: "Innovation Hub", orders: 25, revenue: 11250, avgOrder: 450 },
    { name: "Future Systems", orders: 22, revenue: 9980, avgOrder: 454 },
    { name: "Digital Dynamics", orders: 19, revenue: 8550, avgOrder: 450 },
  ];

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
          <CardHeader>
            <CardTitle>Client Acquisition</CardTitle>
            <CardDescription>New vs returning clients monthly</CardDescription>
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
          <CardHeader>
            <CardTitle>Client Metrics Summary</CardTitle>
            <CardDescription>Key client performance indicators</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-2xl font-bold">89</div>
                <p className="text-xs text-muted-foreground">Total Active Clients</p>
              </div>
              <div>
                <div className="text-2xl font-bold">€456</div>
                <p className="text-xs text-muted-foreground">Average Order Value</p>
              </div>
              <div>
                <div className="text-2xl font-bold">76%</div>
                <p className="text-xs text-muted-foreground">Client Retention Rate</p>
              </div>
              <div>
                <div className="text-2xl font-bold">14</div>
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
