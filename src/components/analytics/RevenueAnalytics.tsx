
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, AreaChart, Area } from "recharts";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Edit, DollarSign } from "lucide-react";

interface RevenueAnalyticsProps {
  detailed?: boolean;
}

const RevenueAnalytics = ({ detailed = false }: RevenueAnalyticsProps) => {
  const [revenueData, setRevenueData] = useState([
    { month: "Jan", revenue: 12450, invoiced: 15600, paid: 11200 },
    { month: "Feb", revenue: 15230, invoiced: 18900, paid: 14100 },
    { month: "Mar", revenue: 18750, invoiced: 22100, paid: 17800 },
    { month: "Apr", revenue: 21340, invoiced: 25600, paid: 20100 },
    { month: "May", revenue: 19680, invoiced: 23400, paid: 18900 },
    { month: "Jun", revenue: 22150, invoiced: 26800, paid: 21300 },
  ]);

  const [quarterlyData, setQuarterlyData] = useState([
    { quarter: "Q1 2023", revenue: 46430 },
    { quarter: "Q2 2023", revenue: 52180 },
    { quarter: "Q3 2023", revenue: 48920 },
    { quarter: "Q4 2023", revenue: 63170 },
    { quarter: "Q1 2024", revenue: 58640 },
    { quarter: "Q2 2024", revenue: 67200 },
  ]);

  const [editingRevenueIndex, setEditingRevenueIndex] = useState<number | null>(null);
  const [revenueEditForm, setRevenueEditForm] = useState({ month: "", revenue: 0, invoiced: 0, paid: 0 });

  // Load real data from invoices and orders
  useEffect(() => {
    try {
      const invoicesData = JSON.parse(localStorage.getItem("invoices") || "[]");
      const ordersData = JSON.parse(localStorage.getItem("orders") || "[]");
      
      if (invoicesData.length > 0 || ordersData.length > 0) {
        const monthlyRevenue = processRevenueData(invoicesData, ordersData);
        setRevenueData(monthlyRevenue);
        
        const quarterlyRevenue = processQuarterlyData(invoicesData, ordersData);
        setQuarterlyData(quarterlyRevenue);
      }
    } catch (error) {
      console.error("Error loading revenue data:", error);
    }
  }, []);

  const processRevenueData = (invoices: any[], orders: any[]) => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const stats: { [key: string]: { revenue: number, invoiced: number, paid: number } } = {};
    
    // Process invoices
    invoices.forEach(invoice => {
      const date = new Date(invoice.created_at);
      const monthKey = monthNames[date.getMonth()];
      
      if (!stats[monthKey]) {
        stats[monthKey] = { revenue: 0, invoiced: 0, paid: 0 };
      }
      
      stats[monthKey].invoiced += parseFloat(invoice.total_amount || 0);
      if (invoice.status === 'paid') {
        stats[monthKey].paid += parseFloat(invoice.total_amount || 0);
      }
    });

    // Process orders for revenue
    orders.forEach(order => {
      const date = new Date(order.created_at);
      const monthKey = monthNames[date.getMonth()];
      
      if (!stats[monthKey]) {
        stats[monthKey] = { revenue: 0, invoiced: 0, paid: 0 };
      }
      
      if (order.status === "Resolved" || order.status === "Invoice Paid") {
        stats[monthKey].revenue += parseFloat(order.amount || order.price || 0);
      }
    });

    return monthNames.map(month => ({
      month,
      revenue: Math.round(stats[month]?.revenue || 0),
      invoiced: Math.round(stats[month]?.invoiced || 0),
      paid: Math.round(stats[month]?.paid || 0),
    })).slice(0, 6);
  };

  const processQuarterlyData = (invoices: any[], orders: any[]) => {
    const quarters: { [key: string]: number } = {};
    
    [...invoices, ...orders].forEach(item => {
      const date = new Date(item.created_at);
      const year = date.getFullYear();
      const quarter = Math.floor(date.getMonth() / 3) + 1;
      const key = `Q${quarter} ${year}`;
      
      const amount = parseFloat(item.total_amount || item.amount || item.price || 0);
      quarters[key] = (quarters[key] || 0) + amount;
    });

    return Object.entries(quarters)
      .map(([quarter, revenue]) => ({ quarter, revenue: Math.round(revenue) }))
      .slice(-6);
  };

  const handleEditRevenue = (index: number) => {
    setEditingRevenueIndex(index);
    setRevenueEditForm(revenueData[index]);
  };

  const handleSaveRevenue = () => {
    if (editingRevenueIndex !== null) {
      const newData = [...revenueData];
      newData[editingRevenueIndex] = revenueEditForm;
      setRevenueData(newData);
      setEditingRevenueIndex(null);
    }
  };

  const chartConfig = {
    revenue: {
      label: "Revenue",
      color: "#22c55e",
    },
    invoiced: {
      label: "Invoiced",
      color: "#3b82f6",
    },
    paid: {
      label: "Paid",
      color: "#f59e0b",
    },
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Revenue Trends</CardTitle>
            <CardDescription>Monthly revenue, invoiced amounts, and payments received</CardDescription>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit Revenue
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Revenue Data</DialogTitle>
                <DialogDescription>Modify monthly revenue figures</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {revenueData.map((data, index) => (
                  <div key={data.month} className="flex items-center gap-4 p-2 border rounded">
                    <span className="w-12 font-medium">{data.month}</span>
                    <Button variant="outline" size="sm" onClick={() => handleEditRevenue(index)}>
                      <DollarSign className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <span className="text-sm text-gray-500">
                      Revenue: €{data.revenue.toLocaleString()}, Invoiced: €{data.invoiced.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
              {editingRevenueIndex !== null && (
                <div className="mt-4 p-4 border rounded space-y-3">
                  <h4 className="font-medium">Editing {revenueEditForm.month}</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label>Revenue (€)</Label>
                      <Input
                        type="number"
                        value={revenueEditForm.revenue}
                        onChange={(e) => setRevenueEditForm({...revenueEditForm, revenue: parseInt(e.target.value) || 0})}
                      />
                    </div>
                    <div>
                      <Label>Invoiced (€)</Label>
                      <Input
                        type="number"
                        value={revenueEditForm.invoiced}
                        onChange={(e) => setRevenueEditForm({...revenueEditForm, invoiced: parseInt(e.target.value) || 0})}
                      />
                    </div>
                    <div>
                      <Label>Paid (€)</Label>
                      <Input
                        type="number"
                        value={revenueEditForm.paid}
                        onChange={(e) => setRevenueEditForm({...revenueEditForm, paid: parseInt(e.target.value) || 0})}
                      />
                    </div>
                  </div>
                  <Button onClick={handleSaveRevenue} className="w-full">Save Changes</Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line type="monotone" dataKey="revenue" stroke="var(--color-revenue)" strokeWidth={2} />
              <Line type="monotone" dataKey="invoiced" stroke="var(--color-invoiced)" strokeWidth={2} />
              <Line type="monotone" dataKey="paid" stroke="var(--color-paid)" strokeWidth={2} />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {detailed && (
        <Card>
          <CardHeader>
            <CardTitle>Quarterly Revenue Growth</CardTitle>
            <CardDescription>Revenue trends over the past 6 quarters</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <AreaChart data={quarterlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="quarter" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area type="monotone" dataKey="revenue" stroke="var(--color-revenue)" fill="var(--color-revenue)" fillOpacity={0.3} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </CardContent>
      )}
    </div>
  );
};

export default RevenueAnalytics;
