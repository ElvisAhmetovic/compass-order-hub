
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem
} from "@/components/ui/dropdown-menu";
import { Plus, X } from "lucide-react";
import { Order, OrderStatus } from "@/types";
import { OrderService } from "@/services/orderService";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

interface MultiStatusBadgesProps {
  order: Order;
  onRefresh: () => void;
  compact?: boolean;
}

const MultiStatusBadges = ({ order, onRefresh, compact = false }: MultiStatusBadgesProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const getStatusColor = (status: OrderStatus) => {
    const statusClasses = {
      "Created": "bg-status-created text-white",
      "In Progress": "bg-status-inprogress text-white", 
      "Complaint": "bg-status-complaint text-white",
      "Invoice Sent": "bg-status-invoicesent text-white",
      "Invoice Paid": "bg-status-invoicepaid text-white",
      "Resolved": "bg-status-resolved text-white",
      "Cancelled": "bg-status-cancelled text-white",
      "Deleted": "bg-status-deleted text-white",
      "Review": "bg-status-review text-white",
    };
    return statusClasses[status] || "bg-gray-500 text-white";
  };

  const activeStatuses = OrderService.getActiveStatuses(order);
  const allStatuses: OrderStatus[] = [
    "Created", "In Progress", "Complaint", "Invoice Sent", 
    "Invoice Paid", "Resolved", "Cancelled", "Deleted", "Review"
  ];

  const handleToggleStatus = async (status: OrderStatus, enabled: boolean) => {
    if (!isAdmin) {
      toast({
        title: "Permission Denied",
        description: "Only administrators can change order statuses.",
        variant: "destructive"
      });
      return;
    }

    try {
      await OrderService.toggleOrderStatus(order.id, status, enabled);
      
      toast({
        title: enabled ? "Status Added" : "Status Removed",
        description: `Order ${enabled ? 'marked as' : 'unmarked as'} "${status}".`,
      });
      
      onRefresh();
      window.dispatchEvent(new CustomEvent('orderStatusChanged'));
    } catch (error) {
      console.error("Error toggling status:", error);
      toast({
        title: "Error",
        description: "Failed to update order status. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleRemoveStatus = async (status: OrderStatus) => {
    await handleToggleStatus(status, false);
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {activeStatuses.map((status) => (
        <Badge 
          key={status} 
          className={`${getStatusColor(status)} ${compact ? 'text-xs px-1 py-0' : ''} relative group`}
        >
          {status}
          {isAdmin && (
            <Button
              variant="ghost"
              size="sm"
              className="ml-1 h-4 w-4 p-0 hover:bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => handleRemoveStatus(status)}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </Badge>
      ))}
      
      {isAdmin && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className={compact ? 'h-6 w-6 p-0' : 'h-8 px-2'}>
              <Plus className="h-3 w-3" />
              {!compact && <span className="ml-1">Add Status</span>}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {allStatuses.map((status) => (
              <DropdownMenuCheckboxItem
                key={status}
                checked={activeStatuses.includes(status)}
                onCheckedChange={(checked) => handleToggleStatus(status, checked)}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-sm ${getStatusColor(status)}`} />
                  {status}
                </div>
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};

export default MultiStatusBadges;
