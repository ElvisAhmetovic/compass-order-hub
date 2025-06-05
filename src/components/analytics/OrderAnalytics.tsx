
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useState, useEffect } from "react";
import { OrderService } from "@/services/orderService";
import { Order } from "@/types";

interface OrderAnalyticsProps {
  detailed?: boolean;
}

const OrderAnalytics = ({ detailed = false }: OrderAnalyticsProps) => {
  const [monthlyData, setMonthlyData] = useState([
    { month: "Jan", orders: 0, completed: 0, cancelled: 0 },
    { month: "Feb", orders: 0, completed: 0, cancelled: 0 },
    { month: "Mar", orders: 0, completed: 0, cancelled: 0 },
    { month: "Apr", orders: 0, completed: 0, cancelled: 0 },
    { month: "May", orders: 0, completed: 0, cancelled: 0 },
    { month: "Jun", orders: 0, completed: 0, cancelled: 0 },
  ]);

  const [statusData, setStatusData] = useState([
    { name: "Completed", value: 0, color: "#22c55e" },
    { name: "In Progress", value: 0, color: "#3b82f6" },
    { name: "Cancelled", value: 0, color: "#ef4444" },
    { name: "Review", value: 0, color: "#8b5cf6" },
  ]);

  const [loading, setLoading] = useState(true);

  // Load real orders data from Supabase
  useEffect(() => {
    const fetchOrdersData = async () => {
      try {
        setLoading(true);
        const orders = await OrderService.getOrders();
        
        const monthlyStats = processOrdersIntoMonthlyStats(orders);
        setMonthlyData(monthlyStats);
        
        const statusStats = processOrdersIntoStatusStats(orders);
        setStatusData(statusStats);
      } catch (error) {
        console.error("Error loading orders data for analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrdersData();

    // Listen for order changes to refresh data
    const handleOrderStatusChange = () => {
      console.log('Order status change detected in OrderAnalytics, refreshing data...');
      fetchOrdersData();
    };

    window.addEventListener('orderStatusChanged', handleOrderStatusChange);
    
    return () => {
      window.removeEventListener('orderStatusChanged', handleOrderStatusChange);
    };
  }, []);

  const processOrdersIntoMonthlyStats = (orders: Order[]) => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const stats: { [key: string]: { orders: number, completed: number, cancelled: number } } = {};
    
    // Initialize all months with 0
    monthNames.forEach(month => {
      stats[month] = { orders: 0, completed: 0, cancelled: 0 };
    });
    
    orders.forEach(order => {
      const date = new Date(order.created_at);
      const monthKey = monthNames[date.getMonth()];
      
      stats[monthKey].orders++;
      if (order.status === "Resolved" || order.status === "Invoice Paid") {
        stats[monthKey].completed++;
      } else if (order.status === "Cancelled") {
        stats[monthKey].cancelled++;
      }
    });

    return monthNames.map(month => ({
      month,
      orders: stats[month].orders,
      completed: stats[month].completed,
      cancelled: stats[month].cancelled,
    })).slice(0, 6); // Show last 6 months
  };

  const processOrdersIntoStatusStats = (orders: Order[]) => {
    const statusCounts: { [key: string]: number } = {};
    
    orders.forEach(order => {
      const status = order.status;
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    return [
      { name: "Completed", value: (statusCounts["Resolved"] || 0) + (statusCounts["Invoice Paid"] || 0), color: "#22c55e" },
      { name: "In Progress", value: statusCounts["In Progress"] || 0, color: "#3b82f6" },
      { name: "Cancelled", value: statusCounts["Cancelled"] || 0, color: "#ef4444" },
      { name: "Review", value: statusCounts["Review"] || 0, color: "#8b5cf6" },
    ];
  };

  const chartConfig = {
    orders: {
      label: "Total Orders",
      color: "#3b82f6",
    },
    completed: {
      label: "Completed",
      color: "#22c55e",
    },
    cancelled: {
      label: "Cancelled",
      color: "#ef4444",
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
          <CardTitle>Orders Over Time</CardTitle>
          <CardDescription>Monthly order trends and completion rates from live data</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="orders" fill="var(--color-orders)" />
              <Bar dataKey="completed" fill="var(--color-completed)" />
              <Bar dataKey="cancelled" fill="var(--color-cancelled)" />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {detailed && (
        <Card>
          <CardHeader>
            <CardTitle>Order Status Distribution</CardTitle>
            <CardDescription>Current breakdown of order statuses from live data</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OrderAnalytics;
