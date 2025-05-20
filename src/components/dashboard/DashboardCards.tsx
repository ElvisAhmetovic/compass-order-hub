
import { Card, CardContent } from "@/components/ui/card";
import { 
  ClipboardCheck, 
  FileText, 
  CreditCard, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Star,
  Trash
} from "lucide-react";
import { OrderStatus } from "@/types";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Order } from "@/types";

interface OrderSummary {
  status: OrderStatus;
  count: number;
  value: number;
}

interface SummaryCardProps {
  icon: React.ReactNode;
  title: string;
  count: number;
  value: number;
  colorClass?: string;
}

const SummaryCard = ({ 
  icon, 
  title, 
  count, 
  value,
  colorClass = "text-primary"
}: SummaryCardProps) => {
  return (
    <Card className="border shadow-sm">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className={`${colorClass} mb-2`}>
            {icon}
          </div>
          <div>
            <h3 className="font-medium text-lg">{title}</h3>
            <div className="text-muted-foreground text-sm">
              {count} {count === 1 ? 'order' : 'orders'} — €{value}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const DashboardCards = () => {
  const [orderSummaries, setOrderSummaries] = useState<OrderSummary[]>([]);
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  
  useEffect(() => {
    // Fetch orders from localStorage
    const fetchOrders = () => {
      try {
        const storedOrders = localStorage.getItem("orders");
        if (!storedOrders) return [];
        
        let orders: Order[] = JSON.parse(storedOrders);
        
        // Filter orders for non-admin users to only show their assigned orders
        if (!isAdmin && user) {
          orders = orders.filter(order => order.assigned_to === user.id);
        }
        
        return orders;
      } catch (error) {
        console.error("Error fetching orders:", error);
        return [];
      }
    };
    
    // Calculate summaries based on orders
    const calculateSummaries = (orders: Order[]) => {
      // Initialize summaries for all status types we want to track
      const summaryMap = new Map<OrderStatus, OrderSummary>();
      
      // Initialize with empty data for each status
      const statusesToTrack: OrderStatus[] = isAdmin 
        ? ["In Progress", "Invoice Sent", "Invoice Paid", "Complaint", "Resolved", "Cancelled", "Deleted", "Review"] 
        : ["In Progress", "Invoice Sent", "Invoice Paid", "Cancelled", "Review"];
      
      statusesToTrack.forEach(status => {
        summaryMap.set(status, { status, count: 0, value: 0 });
      });
      
      // Update summaries with actual data
      orders.forEach(order => {
        if (summaryMap.has(order.status)) {
          const summary = summaryMap.get(order.status)!;
          summary.count += 1;
          summary.value += order.price;
        }
      });
      
      // Convert map to array
      return Array.from(summaryMap.values());
    };
    
    const orders = fetchOrders();
    const summaries = calculateSummaries(orders);
    setOrderSummaries(summaries);
  }, [isAdmin, user]);

  const getIcon = (status: OrderStatus) => {
    const iconProps = { className: "h-6 w-6" };
    
    switch (status) {
      case "In Progress":
        return <ClipboardCheck {...iconProps} />;
      case "Invoice Sent":
        return <FileText {...iconProps} />;
      case "Invoice Paid":
        return <CreditCard {...iconProps} />;
      case "Complaint":
        return <AlertCircle {...iconProps} />;
      case "Resolved":
        return <CheckCircle {...iconProps} />;
      case "Cancelled":
        return <XCircle {...iconProps} />;
      case "Deleted":
        return <Trash {...iconProps} />;
      case "Review":
        return <Star {...iconProps} />;
      default:
        return <ClipboardCheck {...iconProps} />;
    }
  };

  const getColorClass = (status: OrderStatus): string => {
    switch (status) {
      case "In Progress":
        return "text-blue-500";
      case "Invoice Sent":
        return "text-purple-500";
      case "Invoice Paid":
        return "text-green-500";
      case "Complaint":
        return "text-amber-500";
      case "Resolved":
        return "text-green-600";
      case "Cancelled":
        return "text-red-500";
      case "Deleted":
        return "text-gray-500";
      case "Review":
        return "text-indigo-500";
      default:
        return "text-primary";
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {orderSummaries.map((summary) => (
        <SummaryCard
          key={summary.status}
          icon={getIcon(summary.status)}
          title={summary.status}
          count={summary.count}
          value={summary.value}
          colorClass={getColorClass(summary.status)}
        />
      ))}
    </div>
  );
};
