
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface OrderAnalyticsProps {
  detailed?: boolean;
}

const OrderAnalytics = ({ detailed = false }: OrderAnalyticsProps) => {
  const monthlyData = [
    { month: "Jan", orders: 65, completed: 45, cancelled: 8 },
    { month: "Feb", orders: 78, completed: 62, cancelled: 5 },
    { month: "Mar", orders: 82, completed: 71, cancelled: 6 },
    { month: "Apr", orders: 91, completed: 79, cancelled: 7 },
    { month: "May", orders: 95, completed: 83, cancelled: 4 },
    { month: "Jun", orders: 88, completed: 76, cancelled: 9 },
  ];

  const statusData = [
    { name: "Completed", value: 426, color: "#22c55e" },
    { name: "In Progress", value: 89, color: "#3b82f6" },
    { name: "Cancelled", value: 39, color: "#ef4444" },
    { name: "Pending", value: 23, color: "#f59e0b" },
  ];

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

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Orders Over Time</CardTitle>
          <CardDescription>Monthly order trends and completion rates</CardDescription>
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
            <CardDescription>Current breakdown of order statuses</CardDescription>
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
