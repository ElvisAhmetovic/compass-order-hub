import { useState } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Send, X, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { OrderService } from "@/services/orderService";
import { Order } from "@/types";
import MultiStatusBadges from "./MultiStatusBadges";

interface OrderRowProps {
  order: Order;
  onOrderClick: (order: Order) => void;
  onRefresh: () => void;
  assigneeName: string;
  hideActions?: boolean;
  hidePriority?: boolean;
  showRemoveFromReview?: boolean;
}

const OrderRow = ({ 
  order, 
  onOrderClick, 
  onRefresh, 
  assigneeName, 
  hideActions = false, 
  hidePriority = false,
  showRemoveFromReview = false
}: OrderRowProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSendingToReview, setIsSendingToReview] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  const formatPrice = (price: number | null) => {
    if (price === null || price === undefined) return "Not set";
    return `€${price.toFixed(2)}`;
  };

  const handleDelete = async () => {
    if (!isAdmin) {
      toast({
        title: "Permission Denied",
        description: "Only administrators can delete orders.",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to delete orders.",
        variant: "destructive"
      });
      return;
    }

    setIsDeleting(true);
    try {
      await OrderService.deleteOrder(order.id);
      
      toast({
        title: "Order deleted",
        description: `Order for ${order.company_name} has been moved to deleted items.`,
      });
      
      onRefresh();
      window.dispatchEvent(new CustomEvent('orderStatusChanged'));
    } catch (error) {
      console.error("Error deleting order:", error);
      toast({
        title: "Error",
        description: "Failed to delete order. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSendToReview = async () => {
    if (!isAdmin) {
      toast({
        title: "Permission Denied",
        description: "Only administrators can send orders to review.",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to send orders to review.",
        variant: "destructive"
      });
      return;
    }

    setIsSendingToReview(true);
    try {
      await OrderService.toggleOrderStatus(order.id, "Review", true);
      
      toast({
        title: "Sent to review",
        description: `Order has been sent to the Reviews section.`,
      });
      
      onRefresh();
      window.dispatchEvent(new CustomEvent('orderStatusChanged'));
    } catch (error) {
      console.error("Error sending order to review:", error);
      toast({
        title: "Error",
        description: "Failed to send order to review. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSendingToReview(false);
    }
  };

  const handleRemoveFromReview = async () => {
    if (!isAdmin) {
      toast({
        title: "Permission Denied",
        description: "Only administrators can remove orders from review.",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to remove orders from review.",
        variant: "destructive"
      });
      return;
    }

    setIsUpdatingStatus(true);
    try {
      await OrderService.toggleOrderStatus(order.id, "Review", false);
      
      toast({
        title: "Removed from review",
        description: `Order has been removed from the Reviews section.`,
      });
      
      onRefresh();
      window.dispatchEvent(new CustomEvent('orderStatusChanged'));
    } catch (error) {
      console.error("Error removing order from review:", error);
      toast({
        title: "Error",
        description: "Failed to remove order from review. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <TableRow 
      className="cursor-pointer hover:bg-gray-50" 
      onClick={() => onOrderClick(order)}
    >
      <TableCell className="font-medium">{order.company_name}</TableCell>
      <TableCell>{assigneeName}</TableCell>
      <TableCell>{formatDate(order.created_at)}</TableCell>
      {!hidePriority && (
        <TableCell>
          <Badge variant={order.priority === 'high' ? 'destructive' : order.priority === 'medium' ? 'default' : 'secondary'}>
            {order.priority}
          </Badge>
        </TableCell>
      )}
      <TableCell>{formatPrice(order.price)}</TableCell>
      <TableCell>
        <MultiStatusBadges order={order} />
      </TableCell>
      <TableCell>{formatDate(order.updated_at)}</TableCell>
      
      {!hideActions && (
        <TableCell>
          <div className="flex flex-col items-start gap-1">
            {/* Remove from Review button - only visible on Reviews page for admins */}
            {showRemoveFromReview && isAdmin && order.status_review && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveFromReview();
                }}
                disabled={isUpdatingStatus}
                className="h-8 px-2 w-full"
              >
                <X className="h-4 w-4 mr-1" />
                {isUpdatingStatus ? "Removing..." : "Remove Review"}
              </Button>
            )}

            {/* Send to Review button - visible for admins on orders not already in Review status */}
            {isAdmin && !order.status_review && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSendToReview();
                }}
                disabled={isSendingToReview}
                className="h-8 px-2 w-full"
              >
                <Send className="h-4 w-4 mr-1" />
                {isSendingToReview ? "Sending..." : "Review"}
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="h-8 w-8 p-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(order.id);
                  }}
                >
                  Copy order ID
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {isAdmin && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete();
                    }}
                    disabled={isDeleting}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {isDeleting ? "Deleting..." : "Delete order"}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </TableCell>
      )}
    </TableRow>
  );
};

export default OrderRow;
