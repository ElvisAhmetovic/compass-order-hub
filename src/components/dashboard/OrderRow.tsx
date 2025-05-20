
import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Order, OrderStatus } from "@/types";
import OrderActions from "./OrderActions";
import { formatDate } from "@/lib/utils";

interface OrderRowProps {
  order: Order;
  onOrderClick: (order: Order) => void;
  onRefresh: () => void;
}

const OrderRow = ({ order, onOrderClick, onRefresh }: OrderRowProps) => {
  const formatCurrency = (amount: number) => {
    return `${amount} EUR`;
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

  return (
    <TableRow 
      className="cursor-pointer hover:bg-muted/50"
      onClick={(e) => {
        // Prevent row click when clicking actions dropdown
        if ((e.target as HTMLElement).closest('[data-no-row-click]')) {
          return;
        }
        onOrderClick(order);
      }}
    >
      <TableCell className="font-medium">{order.company_name}</TableCell>
      <TableCell>{order.assigned_to || "Unassigned"}</TableCell>
      <TableCell>
        <div className="flex flex-col">
          <span>{formatDate(order.created_at)}</span>
        </div>
      </TableCell>
      <TableCell>
        <Badge className={getPriorityColor(order.priority)}>{order.priority}</Badge>
      </TableCell>
      <TableCell>{formatCurrency(order.price)}</TableCell>
      <TableCell>
        <Badge className={getStatusColor(order.status)}>
          {order.status}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex flex-col">
          <span>{formatDate(order.updated_at)}</span>
        </div>
      </TableCell>
      <TableCell data-no-row-click>
        <div onClick={(e) => e.stopPropagation()}>
          <OrderActions 
            order={order} 
            onOrderView={onOrderClick}
            onRefresh={onRefresh}
          />
        </div>
      </TableCell>
    </TableRow>
  );
};

export default OrderRow;
