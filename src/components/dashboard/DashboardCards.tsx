
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
import { OrderService } from "@/services/orderService";

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

interface DashboardCardsProps {
  isYearlyPackages?: boolean;
}

export const DashboardCards = ({ isYearlyPackages = false }: DashboardCardsProps) => {
  const [orderSummaries, setOrderSummaries] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        console.log('DashboardCards: Starting to fetch stats...');
        setLoading(true);
        setError(null);
        
        let allOrders: Order[];
        if (isYearlyPackages) {
          console.log('DashboardCards: Fetching yearly packages');
          allOrders = await OrderService.getYearlyPackages();
        } else {
          console.log('DashboardCards: Fetching regular orders (excluding yearly packages)');
          allOrders = await OrderService.getOrders(false); // Exclude yearly packages for regular dashboard
        }

        console.log(`DashboardCards: Fetched ${allOrders.length} orders`);

        // Filter orders for non-admin users to only show their assigned orders
        if (!isAdmin && user) {
          allOrders = allOrders.filter(order => order.assigned_to === user.id);
          console.log(`DashboardCards: Filtered to ${allOrders.length} orders for user ${user.id}`);
        }
        
        const summaries = calculateSummaries(allOrders);
        console.log('DashboardCards: Calculated summaries:', summaries);
        setOrderSummaries(summaries);
      } catch (error) {
        console.error("DashboardCards: Error fetching dashboard stats:", error);
        setError("Failed to load dashboard statistics");
      } finally {
        setLoading(false);
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
          summary.value += parseFloat(order.price?.toString() || '0');
        }
      });
      
      // Convert map to array
      return Array.from(summaryMap.values());
    };
    
    // Only fetch if user exists
    if (user) {
      fetchStats();
    }

    // Listen for order changes to refresh data
    const handleOrderStatusChange = () => {
      console.log('DashboardCards: Order status change detected, refreshing data...');
      if (user) {
        fetchStats();
      }
    };

    window.addEventListener('orderStatusChanged', handleOrderStatusChange);
    
    return () => {
      window.removeEventListener('orderStatusChanged', handleOrderStatusChange);
    };
  }, [isAdmin, user, isYearlyPackages]);

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

  if (!user) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="border shadow-sm">
          <CardContent className="p-6">
            <p className="text-muted-foreground">Please log in to view dashboard</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border shadow-sm">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-6 w-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-1"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="border shadow-sm">
          <CardContent className="p-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

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
