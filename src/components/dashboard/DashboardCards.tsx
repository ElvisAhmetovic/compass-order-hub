
import { Card, CardContent } from "@/components/ui/card";
import { 
  ClipboardCheck, 
  FileText, 
  CreditCard, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Star,
  Trash,
  Package
} from "lucide-react";
import { OrderStatus } from "@/types";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useSupabaseAuth } from "@/context/SupabaseAuthContext";
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

interface UserOrderSummary {
  orderCount: number;
  totalSpent: number;
  lastOrder?: {
    date: string;
    package?: string;
  }
}

const UserOrderSummaryCard = ({ orderCount, totalSpent, lastOrder }: UserOrderSummary) => {
  return (
    <Card className="border shadow-sm">
      <CardContent className="p-6">
        <div className="flex flex-col space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-medium text-lg">Your Orders</h3>
            <Package className="text-primary h-6 w-6" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Orders</p>
              <p className="text-2xl font-semibold">{orderCount}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Spent</p>
              <p className="text-2xl font-semibold">€{totalSpent}</p>
            </div>
          </div>
          
          {lastOrder && (
            <div className="pt-2 border-t">
              <p className="text-sm text-muted-foreground">Last Order</p>
              <p className="text-sm">{new Date(lastOrder.date).toLocaleDateString()}</p>
              {lastOrder.package && (
                <p className="text-sm font-medium mt-1">{lastOrder.package}</p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export const DashboardCards = () => {
  const [orderSummaries, setOrderSummaries] = useState<OrderSummary[]>([]);
  const [userOrderSummary, setUserOrderSummary] = useState<UserOrderSummary>({
    orderCount: 0,
    totalSpent: 0
  });
  
  const { user: localUser } = useAuth();
  const { user: supabaseUser } = useSupabaseAuth();
  
  const user = supabaseUser || localUser;
  const isAdmin = user?.role === "admin" || user?.role === "owner";
  
  useEffect(() => {
    // Fetch orders from localStorage
    const fetchOrders = () => {
      try {
        const storedOrders = localStorage.getItem("orders");
        if (!storedOrders) return [];
        
        return JSON.parse(storedOrders);
      } catch (error) {
        console.error("Error fetching orders:", error);
        return [];
      }
    };
    
    // Calculate summaries based on orders
    const calculateSummaries = (orders: Order[]) => {
      // For admin users: show status-based summaries
      if (isAdmin) {
        // Initialize summaries for all status types we want to track
        const summaryMap = new Map<OrderStatus, OrderSummary>();
        
        // Initialize with empty data for each status
        const statusesToTrack: OrderStatus[] = [
          "In Progress", "Invoice Sent", "Invoice Paid", "Complaint", 
          "Resolved", "Cancelled", "Deleted", "Review"
        ];
        
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
      }
      // For regular users: return empty array as we'll handle their orders separately
      return [];
    };
    
    // Calculate user-specific order summary
    const calculateUserOrderSummary = (orders: Order[]) => {
      if (!user) return {
        orderCount: 0,
        totalSpent: 0
      };
      
      // Filter orders assigned to this user
      const userOrders = orders.filter(order => order.assigned_to === user.id);
      
      // Calculate total spent and order count
      const totalSpent = userOrders.reduce((sum, order) => sum + order.price, 0);
      
      // Find the most recent order
      const sortedOrders = [...userOrders].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      const lastOrder = sortedOrders.length > 0 ? {
        date: sortedOrders[0].created_at,
        package: sortedOrders[0].description // Will be updated with proper package info later
      } : undefined;
      
      return {
        orderCount: userOrders.length,
        totalSpent,
        lastOrder
      };
    };
    
    const orders = fetchOrders();
    
    // For admin users, calculate status-based summaries
    if (isAdmin) {
      const summaries = calculateSummaries(orders);
      setOrderSummaries(summaries);
    } else {
      // For regular users, calculate their orders summary
      const summary = calculateUserOrderSummary(orders);
      setUserOrderSummary(summary);
    }
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

  // Render different cards based on user role
  if (isAdmin) {
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
  }
  
  // User view - show summary of their orders
  return (
    <div className="md:max-w-xl mb-8">
      <UserOrderSummaryCard 
        orderCount={userOrderSummary.orderCount} 
        totalSpent={userOrderSummary.totalSpent}
        lastOrder={userOrderSummary.lastOrder}
      />
    </div>
  );
};
