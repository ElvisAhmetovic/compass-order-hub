
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { TableRow, TableCell } from "@/components/ui/table";
import { Order } from "@/types";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

interface OrderRowProps {
  order: Order;
  onOrderClick: (order: Order) => void;
  onRefresh: () => void;
  assigneeName: string;
  hideActions?: boolean;
  hidePriority?: boolean;
}

const OrderRow = ({ 
  order, 
  onOrderClick, 
  onRefresh, 
  assigneeName, 
  hideActions = false, 
  hidePriority = false 
}: OrderRowProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const getStatusColor = (status: string) => {
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

  const getPriorityColor = (priority: string) => {
    const priorityClasses = {
      "Low": "bg-priority-low text-white",
      "Medium": "bg-priority-medium text-white",
      "High": "bg-priority-high text-white",
      "Urgent": "bg-priority-urgent text-white",
    };
    return priorityClasses[priority] || "bg-gray-500 text-white";
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // In a real app, this would be an API call to delete the order
      const ordersInStorage = JSON.parse(localStorage.getItem("orders") || "[]");
      const updatedOrders = ordersInStorage.filter((o: Order) => o.id !== order.id);
      localStorage.setItem("orders", JSON.stringify(updatedOrders));
      
      onRefresh();
    } catch (error) {
      console.error("Error deleting order:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      // In a real app, this would be an API call to update the order status
      const ordersInStorage = JSON.parse(localStorage.getItem("orders") || "[]");
      const updatedOrders = ordersInStorage.map((o: Order) => 
        o.id === order.id ? { ...o, status: newStatus, updated_at: new Date().toISOString() } : o
      );
      localStorage.setItem("orders", JSON.stringify(updatedOrders));
      
      onRefresh();
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  };

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onOrderClick(order)}
            className="px-2 h-7"
          >
            <FileText className="h-4 w-4 mr-1" />
            <span className="sr-only">View Details</span>
          </Button>
          <div className="font-medium truncate max-w-[120px]">
            {order.company_name}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="font-medium truncate max-w-[100px]">
          {assigneeName && assigneeName !== "Unknown User" && assigneeName !== "Admin User" ? 
            assigneeName : 
            order.assigned_to ? "Assigned User" : "Unassigned"}
        </div>
      </TableCell>
      <TableCell>
        {formatDate(order.created_at)}
      </TableCell>
      {!hidePriority && (
        <TableCell>
          <Badge className={getPriorityColor(order.priority)}>{order.priority}</Badge>
        </TableCell>
      )}
      <TableCell>
        {formatCurrency(order.price)}
      </TableCell>
      <TableCell>
        <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
      </TableCell>
      <TableCell>
        {formatDate(order.updated_at)}
      </TableCell>
      <TableCell>
        {!hideActions && isAdmin ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="p-0 h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onOrderClick(order)}>
                View Details
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleUpdateStatus("In Progress")}>
                Mark as In Progress
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleUpdateStatus("Resolved")}>
                Mark as Resolved
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleUpdateStatus("Invoice Sent")}>
                Mark as Invoice Sent
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleUpdateStatus("Invoice Paid")}>
                Mark as Invoice Paid
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleUpdateStatus("Complaint")}>
                Mark as Complaint
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleDelete}
                className="text-destructive"
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete Order"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button 
            variant="ghost" 
            size="sm" 
            className="p-0 h-8 w-8"
            onClick={() => onOrderClick(order)}
          >
            <FileText className="h-4 w-4" />
            <span className="sr-only">View Details</span>
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
};

export default OrderRow;
