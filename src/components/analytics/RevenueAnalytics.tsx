
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, AreaChart, Area } from "recharts";
import { useState, useEffect } from "react";
import { OrderService } from "@/services/orderService";
import { Order } from "@/types";

interface RevenueAnalyticsProps {
  detailed?: boolean;
}

const RevenueAnalytics = ({ detailed = false }: RevenueAnalyticsProps) => {
  const [revenueData, setRevenueData] = useState([
    { month: "Jan", revenue: 0, invoiced: 0, paid: 0 },
    { month: "Feb", revenue: 0, invoiced: 0, paid: 0 },
    { month: "Mar", revenue: 0, invoiced: 0, paid: 0 },
    { month: "Apr", revenue: 0, invoiced: 0, paid: 0 },
    { month: "May", revenue: 0, invoiced: 0, paid: 0 },
    { month: "Jun", revenue: 0, invoiced: 0, paid: 0 },
  ]);

  const [quarterlyData, setQuarterlyData] = useState([
    { quarter: "Q1 2023", revenue: 0 },
    { quarter: "Q2 2023", revenue: 0 },
    { quarter: "Q3 2023", revenue: 0 },
    { quarter: "Q4 2023", revenue: 0 },
    { quarter: "Q1 2024", revenue: 0 },
    { quarter: "Q2 2024", revenue: 0 },
  ]);

  const [loading, setLoading] = useState(true);

  // Load real data from orders
  useEffect(() => {
    const fetchRevenueData = async () => {
      try {
        setLoading(true);
        const orders = await OrderService.getOrders();
        
        const monthlyRevenue = processRevenueData(orders);
        setRevenueData(monthlyRevenue);
        
        const quarterlyRevenue = processQuarterlyData(orders);
        setQuarterlyData(quarterlyRevenue);
      } catch (error) {
        console.error("Error loading revenue data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRevenueData();

    // Listen for order changes to refresh data
    const handleOrderStatusChange = () => {
      console.log('Order status change detected in RevenueAnalytics, refreshing data...');
      fetchRevenueData();
    };

    window.addEventListener('orderStatusChanged', handleOrderStatusChange);
    
    return () => {
      window.removeEventListener('orderStatusChanged', handleOrderStatusChange);
    };
  }, []);

  const processRevenueData = (orders: Order[]) => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const stats: { [key: string]: { revenue: number, invoiced: number, paid: number } } = {};
    
    // Initialize all months with 0
    monthNames.forEach(month => {
      stats[month] = { revenue: 0, invoiced: 0, paid: 0 };
    });

    // Process orders for revenue
    orders.forEach(order => {
      const date = new Date(order.created_at);
      const monthKey = monthNames[date.getMonth()];
      const amount = parseFloat(order.price?.toString() || '0');
      
      if (order.status === "Invoice Sent") {
        stats[monthKey].invoiced += amount;
      } else if (order.status === "Invoice Paid") {
        stats[monthKey].paid += amount;
        stats[monthKey].revenue += amount;
      } else if (order.status === "Resolved") {
        stats[monthKey].revenue += amount;
      }
    });

    return monthNames.map(month => ({
      month,
      revenue: Math.round(stats[month].revenue),
      invoiced: Math.round(stats[month].invoiced),
      paid: Math.round(stats[month].paid),
    })).slice(0, 6);
  };

  const processQuarterlyData = (orders: Order[]) => {
    const quarters: { [key: string]: number } = {};
    
    orders.forEach(order => {
      const date = new Date(order.created_at);
      const year = date.getFullYear();
      const quarter = Math.floor(date.getMonth() / 3) + 1;
      const key = `Q${quarter} ${year}`;
      
      if (order.status === "Resolved" || order.status === "Invoice Paid") {
        const amount = parseFloat(order.price?.toString() || '0');
        quarters[key] = (quarters[key] || 0) + amount;
      }
    });

    return Object.entries(quarters)
      .map(([quarter, revenue]) => ({ quarter, revenue: Math.round(revenue) }))
      .slice(-6);
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

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded mb-4"></div>
              <div className="h-[300px] bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trends</CardTitle>
          <CardDescription>Monthly revenue, invoiced amounts, and payments from live data</CardDescription>
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
            <CardDescription>Revenue trends over recent quarters from live data</CardDescription>
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
        </Card>
      )}
    </div>
  );
};

export default RevenueAnalytics;
