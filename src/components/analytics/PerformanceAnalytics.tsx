
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const PerformanceAnalytics = () => {
  const performanceData = [
    { month: "Jan", avgResponseTime: 2.4, completionRate: 89, customerSatisfaction: 4.2 },
    { month: "Feb", avgResponseTime: 2.1, completionRate: 92, customerSatisfaction: 4.4 },
    { month: "Mar", avgResponseTime: 1.8, completionRate: 94, customerSatisfaction: 4.5 },
    { month: "Apr", avgResponseTime: 2.0, completionRate: 91, customerSatisfaction: 4.3 },
    { month: "May", avgResponseTime: 1.9, completionRate: 93, customerSatisfaction: 4.6 },
    { month: "Jun", avgResponseTime: 1.7, completionRate: 95, customerSatisfaction: 4.7 },
  ];

  const teamPerformance = [
    { subject: "Order Processing", A: 120, B: 110, fullMark: 150 },
    { subject: "Customer Service", A: 98, B: 130, fullMark: 150 },
    { subject: "Quality Control", A: 86, B: 90, fullMark: 150 },
    { subject: "Response Time", A: 99, B: 85, fullMark: 150 },
    { subject: "Problem Resolution", A: 85, B: 95, fullMark: 150 },
    { subject: "Client Satisfaction", A: 95, B: 115, fullMark: 150 },
  ];

  const userMetrics = [
    { name: "John Smith", orders: 42, completion: 96, avgTime: "1.2h", rating: 4.8 },
    { name: "Sarah Johnson", orders: 38, completion: 94, avgTime: "1.4h", rating: 4.6 },
    { name: "Mike Davis", orders: 35, completion: 92, avgTime: "1.6h", rating: 4.5 },
    { name: "Lisa Wilson", orders: 31, completion: 89, avgTime: "1.8h", rating: 4.3 },
    { name: "Tom Brown", orders: 28, completion: 91, avgTime: "1.5h", rating: 4.4 },
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

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Performance Trends</CardTitle>
            <CardDescription>Key performance metrics over time</CardDescription>
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
          <CardDescription>Individual user performance and productivity</CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceAnalytics;
