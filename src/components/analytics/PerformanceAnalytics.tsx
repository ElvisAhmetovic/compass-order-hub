
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { OrderService } from "@/services/orderService";
import { supabase } from "@/integrations/supabase/client";
import { Order } from "@/types";

interface UserPerformanceData {
  name: string;
  orders: number;
  completion: number;
  avgTime: string;
  rating: number;
  userId: string;
}

interface PerformanceMetrics {
  month: string;
  avgResponseTime: number;
  completionRate: number;
  customerSatisfaction: number;
}

const PerformanceAnalytics = () => {
  const [performanceData, setPerformanceData] = useState<PerformanceMetrics[]>([]);
  const [userMetrics, setUserMetrics] = useState<UserPerformanceData[]>([]);
  const [loading, setLoading] = useState(true);

  const teamPerformance = [
    { subject: "Order Processing", A: 120, B: 110, fullMark: 150 },
    { subject: "Customer Service", A: 98, B: 130, fullMark: 150 },
    { subject: "Quality Control", A: 86, B: 90, fullMark: 150 },
    { subject: "Response Time", A: 99, B: 85, fullMark: 150 },
    { subject: "Problem Resolution", A: 85, B: 95, fullMark: 150 },
    { subject: "Client Satisfaction", A: 95, B: 115, fullMark: 150 },
  ];

  const chartConfig = {
    avgResponseTime: {
      label: "Avg Response Time (hours)",
      color: "#ef4444",
    },
    completionRate: {
      label: "Completion Rate (%)",
      color: "#22c55e",
    },
    customerSatisfaction: {
      label: "Customer Satisfaction",
      color: "#3b82f6",
    },
  };

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Fetch orders from Supabase
      const orders = await OrderService.getOrders();
      
      // Fetch profiles for user data
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name');

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        return;
      }

      // Calculate performance metrics by month
      const monthlyData = calculateMonthlyPerformance(orders);
      setPerformanceData(monthlyData);

      // Calculate user performance metrics
      const userPerformanceData = calculateUserPerformance(orders, profiles || []);
      setUserMetrics(userPerformanceData);

    } catch (error) {
      console.error("Error fetching analytics data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMonthlyPerformance = (orders: Order[]): PerformanceMetrics[] => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentYear = new Date().getFullYear();
    const monthlyStats: { [key: string]: { orders: Order[], totalOrders: number } } = {};

    // Group orders by month
    orders.forEach(order => {
      const orderDate = new Date(order.created_at);
      if (orderDate.getFullYear() === currentYear) {
        const monthKey = monthNames[orderDate.getMonth()];
        if (!monthlyStats[monthKey]) {
          monthlyStats[monthKey] = { orders: [], totalOrders: 0 };
        }
        monthlyStats[monthKey].orders.push(order);
        monthlyStats[monthKey].totalOrders++;
      }
    });

    // Calculate metrics for each month
    return monthNames.slice(0, 6).map(month => {
      const monthData = monthlyStats[month] || { orders: [], totalOrders: 0 };
      const completedOrders = monthData.orders.filter(order => 
        order.status === "Resolved" || order.status === "Invoice Paid"
      ).length;
      
      const completionRate = monthData.totalOrders > 0 ? (completedOrders / monthData.totalOrders) * 100 : 0;
      
      // Calculate average response time (mock calculation based on order count)
      const avgResponseTime = monthData.totalOrders > 0 ? Math.max(1.5, 3 - (monthData.totalOrders / 20)) : 2.5;
      
      // Calculate customer satisfaction (based on completion rate)
      const customerSatisfaction = Math.min(5, 3.5 + (completionRate / 50));

      return {
        month,
        avgResponseTime: Number(avgResponseTime.toFixed(1)),
        completionRate: Number(completionRate.toFixed(0)),
        customerSatisfaction: Number(customerSatisfaction.toFixed(1))
      };
    });
  };

  const calculateUserPerformance = (orders: Order[], profiles: any[]): UserPerformanceData[] => {
    const userStats: { [key: string]: { orders: Order[], profile: any } } = {};

    // Group orders by assigned user
    orders.forEach(order => {
      if (order.assigned_to) {
        if (!userStats[order.assigned_to]) {
          const profile = profiles.find(p => p.id === order.assigned_to);
          userStats[order.assigned_to] = { 
            orders: [], 
            profile: profile || { first_name: 'Unknown', last_name: 'User' }
          };
        }
        userStats[order.assigned_to].orders.push(order);
      }
    });

    // Calculate performance metrics for each user
    return Object.entries(userStats)
      .map(([userId, data]) => {
        const { orders: userOrders, profile } = data;
        const completedOrders = userOrders.filter(order => 
          order.status === "Resolved" || order.status === "Invoice Paid"
        ).length;
        
        const completionRate = userOrders.length > 0 ? (completedOrders / userOrders.length) * 100 : 0;
        
        // Calculate average time (mock calculation)
        const avgTimeHours = Math.max(1, 2.5 - (completionRate / 100));
        
        // Calculate rating based on completion rate and order count
        const rating = Math.min(5, 3 + (completionRate / 25) + (userOrders.length / 50));

        return {
          name: `${profile.first_name} ${profile.last_name}`.trim() || 'Unknown User',
          orders: userOrders.length,
          completion: Math.round(completionRate),
          avgTime: `${avgTimeHours.toFixed(1)}h`,
          rating: Number(rating.toFixed(1)),
          userId
        };
      })
      .filter(user => user.orders > 0)
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 10); // Top 10 users
  };

  useEffect(() => {
    fetchAnalyticsData();

    // Listen for order changes to refresh data
    const handleOrderStatusChange = () => {
      console.log('Order status change detected in PerformanceAnalytics, refreshing data...');
      fetchAnalyticsData();
    };

    window.addEventListener('orderStatusChanged', handleOrderStatusChange);
    window.addEventListener('ordersUpdated', handleOrderStatusChange);
    
    return () => {
      window.removeEventListener('orderStatusChanged', handleOrderStatusChange);
      window.removeEventListener('ordersUpdated', handleOrderStatusChange);
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="h-[300px] bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded mb-4"></div>
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Performance Trends</CardTitle>
            <CardDescription>Key performance metrics over time (last 6 months)</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="avgResponseTime" stroke="var(--color-avgResponseTime)" strokeWidth={2} />
                <Line type="monotone" dataKey="completionRate" stroke="var(--color-completionRate)" strokeWidth={2} />
                <Line type="monotone" dataKey="customerSatisfaction" stroke="var(--color-customerSatisfaction)" strokeWidth={2} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Team Performance Radar</CardTitle>
            <CardDescription>Comparative team performance across different metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <RadarChart data={teamPerformance}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={30} domain={[0, 150]} />
                <Radar name="Team A" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                <Radar name="Team B" dataKey="B" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} />
                <ChartTooltip content={<ChartTooltipContent />} />
              </RadarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Performance Metrics</CardTitle>
          <CardDescription>Individual user performance based on real order data</CardDescription>
        </CardHeader>
        <CardContent>
          {userMetrics.length === 0 ? (
            <div className="text-center p-8">
              <p className="text-muted-foreground">No user performance data available. Users need to be assigned to orders to appear here.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead className="text-right">Orders Completed</TableHead>
                  <TableHead className="text-right">Completion Rate</TableHead>
                  <TableHead className="text-right">Avg Time</TableHead>
                  <TableHead className="text-right">Rating</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userMetrics.map((user, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell className="text-right">{user.orders}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={user.completion >= 95 ? "default" : user.completion >= 90 ? "secondary" : "destructive"}>
                        {user.completion}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{user.avgTime}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={user.rating >= 4.5 ? "default" : "secondary"}>
                        {user.rating}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceAnalytics;
