
import { TableRow, TableCell } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2, UserPlus, UserMinus } from "lucide-react";
import { Order } from "@/types";
import { OrderService } from "@/services/orderService";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import MultiStatusBadges from "./MultiStatusBadges";

interface OrderRowProps {
  order: Order;
  onOrderClick: (order: Order) => void;
  onRefresh: () => void;
  assigneeName: string;
  hideActions?: boolean;
  hidePriority?: boolean;
  isSelected?: boolean;
  onSelect?: (checked: boolean) => void;
}

const OrderRow = ({ 
  order, 
  onOrderClick, 
  onRefresh, 
  assigneeName, 
  hideActions = false, 
  hidePriority = false,
  isSelected = false,
  onSelect
}: OrderRowProps) => {
  const { toast } = useToast();

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await OrderService.deleteOrder(order.id);
      toast({
        title: "Order Deleted",
        description: "Order has been successfully deleted.",
      });
      onRefresh();
    } catch (error) {
      console.error("Error deleting order:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete order. Please try again.",
      });
    }
  };

  const handleUnassign = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await OrderService.unassignOrder(order.id);
      toast({
        title: "Order Unassigned",
        description: "Order has been unassigned successfully.",
      });
      onRefresh();
    } catch (error) {
      console.error("Error unassigning order:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to unassign order. Please try again.",
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <TableRow 
      className="cursor-pointer hover:bg-muted/50" 
      onClick={() => onOrderClick(order)}
    >
      <TableCell onClick={(e) => e.stopPropagation()}>
        {onSelect && (
          <Checkbox
            checked={isSelected}
            onCheckedChange={onSelect}
            aria-label={`Select order ${order.company_name}`}
          />
        )}
      </TableCell>
      
      <TableCell className="font-medium">
        <div className="flex flex-col">
          <span className="truncate">{order.company_name}</span>
          {order.contact_email && (
            <span className="text-xs text-muted-foreground truncate">
              {order.contact_email}
            </span>
          )}
        </div>
      </TableCell>
      
      <TableCell>
        <div className="flex items-center">
          <Badge variant="outline" className="text-xs">
            {assigneeName}
          </Badge>
        </div>
      </TableCell>
      
      <TableCell className="text-sm text-muted-foreground">
        {order.created_at ? format(new Date(order.created_at), 'MMM dd, yyyy') : 'N/A'}
      </TableCell>
      
      {!hidePriority && (
        <TableCell>
          <Badge className={`text-xs ${getPriorityColor(order.priority || 'Medium')}`}>
            {order.priority || 'Medium'}
          </Badge>
        </TableCell>
      )}
      
      <TableCell className="font-semibold">
        {order.price ? `${order.currency || 'EUR'} ${order.price}` : 'N/A'}
      </TableCell>
      
      <TableCell>
        <MultiStatusBadges order={order} />
      </TableCell>
      
      <TableCell className="text-sm text-muted-foreground">
        {order.updated_at ? format(new Date(order.updated_at), 'MMM dd, yyyy') : 'N/A'}
      </TableCell>
      
      <TableCell onClick={(e) => e.stopPropagation()}>
        {!hideActions && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onOrderClick(order); }}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Order
              </DropdownMenuItem>
              {order.assigned_to && (
                <DropdownMenuItem onClick={handleUnassign}>
                  <UserMinus className="mr-2 h-4 w-4" />
                  Unassign
                </DropdownMenuItem>
              )}
              <DropdownMenuItem 
                onClick={handleDelete}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </TableCell>
    </TableRow>
  );
};

export default OrderRow;
