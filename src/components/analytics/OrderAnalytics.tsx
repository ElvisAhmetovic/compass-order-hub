
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Edit } from "lucide-react";

interface OrderAnalyticsProps {
  detailed?: boolean;
}

const OrderAnalytics = ({ detailed = false }: OrderAnalyticsProps) => {
  const [monthlyData, setMonthlyData] = useState([
    { month: "Jan", orders: 65, completed: 45, cancelled: 8 },
    { month: "Feb", orders: 78, completed: 62, cancelled: 5 },
    { month: "Mar", orders: 82, completed: 71, cancelled: 6 },
    { month: "Apr", orders: 91, completed: 79, cancelled: 7 },
    { month: "May", orders: 95, completed: 83, cancelled: 4 },
    { month: "Jun", orders: 88, completed: 76, cancelled: 9 },
  ]);

  const [statusData, setStatusData] = useState([
    { name: "Completed", value: 426, color: "#22c55e" },
    { name: "In Progress", value: 89, color: "#3b82f6" },
    { name: "Cancelled", value: 39, color: "#ef4444" },
    { name: "Pending", value: 23, color: "#f59e0b" },
  ]);

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ month: "", orders: 0, completed: 0, cancelled: 0 });

  // Load real orders data from localStorage
  useEffect(() => {
    try {
      const ordersData = JSON.parse(localStorage.getItem("orders") || "[]");
      if (ordersData.length > 0) {
        // Process real orders data into monthly stats
        const monthlyStats = processOrdersIntoMonthlyStats(ordersData);
        setMonthlyData(monthlyStats);
        
        const statusStats = processOrdersIntoStatusStats(ordersData);
        setStatusData(statusStats);
      }
    } catch (error) {
      console.error("Error loading orders data:", error);
    }
  }, []);

  const processOrdersIntoMonthlyStats = (orders: any[]) => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const stats: { [key: string]: { orders: number, completed: number, cancelled: number } } = {};
    
    orders.forEach(order => {
      const date = new Date(order.created_at);
      const monthKey = monthNames[date.getMonth()];
      
      if (!stats[monthKey]) {
        stats[monthKey] = { orders: 0, completed: 0, cancelled: 0 };
      }
      
      stats[monthKey].orders++;
      if (order.status === "Resolved" || order.status === "Invoice Paid") {
        stats[monthKey].completed++;
      } else if (order.status === "Cancelled") {
        stats[monthKey].cancelled++;
      }
    });

    return monthNames.map(month => ({
      month,
      orders: stats[month]?.orders || 0,
      completed: stats[month]?.completed || 0,
      cancelled: stats[month]?.cancelled || 0,
    })).slice(0, 6); // Show last 6 months
  };

  const processOrdersIntoStatusStats = (orders: any[]) => {
    const statusCounts: { [key: string]: number } = {};
    
    orders.forEach(order => {
      const status = order.status;
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    return [
      { name: "Completed", value: (statusCounts["Resolved"] || 0) + (statusCounts["Invoice Paid"] || 0), color: "#22c55e" },
      { name: "In Progress", value: statusCounts["In Progress"] || 0, color: "#3b82f6" },
      { name: "Cancelled", value: statusCounts["Cancelled"] || 0, color: "#ef4444" },
      { name: "Pending", value: statusCounts["Pending"] || 0, color: "#f59e0b" },
    ];
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setEditForm(monthlyData[index]);
  };

  const handleSave = () => {
    if (editingIndex !== null) {
      const newData = [...monthlyData];
      newData[editingIndex] = editForm;
      setMonthlyData(newData);
      setEditingIndex(null);
    }
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

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Orders Over Time</CardTitle>
            <CardDescription>Monthly order trends and completion rates</CardDescription>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit Data
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Monthly Data</DialogTitle>
                <DialogDescription>Click on any month to edit its values</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {monthlyData.map((data, index) => (
                  <div key={data.month} className="flex items-center gap-4 p-2 border rounded">
                    <span className="w-12 font-medium">{data.month}</span>
                    <Button variant="outline" size="sm" onClick={() => handleEdit(index)}>
                      Edit
                    </Button>
                    <span className="text-sm text-gray-500">
                      Orders: {data.orders}, Completed: {data.completed}, Cancelled: {data.cancelled}
                    </span>
                  </div>
                ))}
              </div>
              {editingIndex !== null && (
                <div className="mt-4 p-4 border rounded space-y-3">
                  <h4 className="font-medium">Editing {editForm.month}</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label>Orders</Label>
                      <Input
                        type="number"
                        value={editForm.orders}
                        onChange={(e) => setEditForm({...editForm, orders: parseInt(e.target.value) || 0})}
                      />
                    </div>
                    <div>
                      <Label>Completed</Label>
                      <Input
                        type="number"
                        value={editForm.completed}
                        onChange={(e) => setEditForm({...editForm, completed: parseInt(e.target.value) || 0})}
                      />
                    </div>
                    <div>
                      <Label>Cancelled</Label>
                      <Input
                        type="number"
                        value={editForm.cancelled}
                        onChange={(e) => setEditForm({...editForm, cancelled: parseInt(e.target.value) || 0})}
                      />
                    </div>
                  </div>
                  <Button onClick={handleSave} className="w-full">Save Changes</Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
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
