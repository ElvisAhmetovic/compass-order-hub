
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, AreaChart, Area } from "recharts";

interface RevenueAnalyticsProps {
  detailed?: boolean;
}

const RevenueAnalytics = ({ detailed = false }: RevenueAnalyticsProps) => {
  const revenueData = [
    { month: "Jan", revenue: 12450, invoiced: 15600, paid: 11200 },
    { month: "Feb", revenue: 15230, invoiced: 18900, paid: 14100 },
    { month: "Mar", revenue: 18750, invoiced: 22100, paid: 17800 },
    { month: "Apr", revenue: 21340, invoiced: 25600, paid: 20100 },
    { month: "May", revenue: 19680, invoiced: 23400, paid: 18900 },
    { month: "Jun", revenue: 22150, invoiced: 26800, paid: 21300 },
  ];

  const quarterlyData = [
    { quarter: "Q1 2023", revenue: 46430 },
    { quarter: "Q2 2023", revenue: 52180 },
    { quarter: "Q3 2023", revenue: 48920 },
    { quarter: "Q4 2023", revenue: 63170 },
    { quarter: "Q1 2024", revenue: 58640 },
    { quarter: "Q2 2024", revenue: 67200 },
  ];

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
        <CardHeader>
          <CardTitle>Revenue Trends</CardTitle>
          <CardDescription>Monthly revenue, invoiced amounts, and payments received</CardDescription>
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
        </Card>
      )}
    </div>
  );
};

export default RevenueAnalytics;
