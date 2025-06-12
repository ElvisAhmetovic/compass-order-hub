import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, FileText, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { TableRow, TableCell } from "@/components/ui/table";
import { Order, OrderStatus } from "@/types";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { InvoiceService } from "@/services/invoiceService";
import { OrderService } from "@/services/orderService";
import MultiStatusBadges from "./MultiStatusBadges";

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
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isSendingToReview, setIsSendingToReview] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
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
      "low": "bg-priority-low text-white border-priority-low",
      "medium": "bg-priority-medium text-white border-priority-medium", 
      "high": "bg-priority-high text-white border-priority-high",
      "urgent": "bg-priority-urgent text-white border-priority-urgent",
    };
    return priorityClasses[priority.toLowerCase()] || "bg-priority-medium text-white border-priority-medium";
  };

  const formatPriorityDisplay = (priority: string) => {
    return priority.charAt(0).toUpperCase() + priority.slice(1);
  };

  const createInvoiceFromOrder = async (orderId: string, orderData: Order, status: OrderStatus) => {
    try {
      // Check if user is authenticated
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "You must be logged in to create invoices.",
          variant: "destructive"
        });
        return;
      }

      // Check if invoice already exists for this order
      const existingInvoices = await InvoiceService.getInvoices();
      const existingInvoice = existingInvoices.find(inv => 
        inv.notes && inv.notes.includes(`Order ID: ${orderId}`)
      );

      if (existingInvoice) {
        // Update existing invoice status
        const invoiceStatus = status === "Invoice Sent" ? "sent" : "paid";
        await InvoiceService.updateInvoice(existingInvoice.id, { status: invoiceStatus });
        
        toast({
          title: "Invoice updated",
          description: `Existing invoice ${existingInvoice.invoice_number} status updated to ${invoiceStatus}.`,
        });
        return;
      }

      // First, create or find the client
      const clients = await InvoiceService.getClients();
      let clientId = clients.find(c => c.name === orderData.company_name)?.id;
      
      if (!clientId) {
        try {
          // Create new client
          const newClient = await InvoiceService.createClient({
            name: orderData.company_name,
            email: orderData.contact_email || `${orderData.company_name.toLowerCase().replace(/\s+/g, '')}@company.com`,
            address: orderData.company_address || '',
            phone: orderData.contact_phone || '',
          });
          clientId = newClient.id;
        } catch (clientError) {
          console.error("Error creating client:", clientError);
          toast({
            title: "Error",
            description: "Failed to create client. Please check your authentication and try again.",
            variant: "destructive"
          });
          return;
        }
      }

      // Create a new invoice from the order
      const invoiceData = {
        client_id: clientId,
        issue_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
        currency: 'EUR',
        payment_terms: 'Net 30',
        notes: `Invoice created from order. Order ID: ${orderId}`,
        internal_notes: `Automatically generated from order ${orderId}`,
        line_items: [
          {
            item_description: orderData.description || 'Service provided',
            quantity: 1,
            unit_price: orderData.price || 0,
            unit: 'pcs',
            vat_rate: 0.19,
            discount_rate: 0
          }
        ]
      };

      const newInvoice = await InvoiceService.createInvoice(invoiceData);
      
      // Update the invoice status to match the order status
      const invoiceStatus = status === "Invoice Sent" ? "sent" : "paid";
      await InvoiceService.updateInvoice(newInvoice.id, { status: invoiceStatus });
      
      toast({
        title: "Invoice created",
        description: `Invoice ${newInvoice.invoice_number} has been created and status set to ${invoiceStatus}.`,
      });

    } catch (error) {
      console.error("Error creating invoice from order:", error);
      toast({
        title: "Error",
        description: "Failed to create invoice from order. Please check your authentication and try again.",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async () => {
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
      // Delete order using Supabase
      await OrderService.deleteOrder(order.id);
      
      onRefresh();
      window.dispatchEvent(new CustomEvent('orderStatusChanged'));
    } catch (error) {
      console.error("Error deleting order:", error);
      toast({
        title: "Error",
        description: "Failed to delete order. Please check your connection and try again.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdateStatus = async (newStatus: OrderStatus) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to update order status.",
        variant: "destructive"
      });
      return;
    }

    setIsUpdatingStatus(true);
    try {
      // Toggle the status instead of replacing it
      await OrderService.toggleOrderStatus(order.id, newStatus, true);
      
      // Create invoice if status is invoice-related
      if (newStatus === "Invoice Sent" || newStatus === "Invoice Paid") {
        await createInvoiceFromOrder(order.id, order, newStatus);
      }
      
      onRefresh();
      window.dispatchEvent(new CustomEvent('orderStatusChanged'));
    } catch (error) {
      console.error("Error updating order status:", error);
      toast({
        title: "Error",
        description: "Failed to update order status. Please check your connection and try again.",
        variant: "destructive"
      });
    } finally {
      setIsUpdatingStatus(false);
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
        title: "Order sent to review",
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
          <Badge className={getPriorityColor(order.priority || "medium")}>
            {formatPriorityDisplay(order.priority || "medium")}
          </Badge>
        </TableCell>
      )}
      <TableCell>
        {formatCurrency(order.price)}
      </TableCell>
      <TableCell>
        <MultiStatusBadges order={order} onRefresh={onRefresh} compact={true} />
      </TableCell>
      <TableCell>
        {formatDate(order.updated_at)}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          {/* Send to Review button - visible for admins on orders not already in Review status */}
          {isAdmin && !order.status_review && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSendToReview}
              disabled={isSendingToReview}
              className="h-8 px-2"
            >
              <Send className="h-4 w-4 mr-1" />
              {isSendingToReview ? "Sending..." : "Review"}
            </Button>
          )}
          
          {!hideActions && isAdmin ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="p-0 h-8 w-8" disabled={isUpdatingStatus}>
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
                  Add In Progress Status
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleUpdateStatus("Resolved")}>
                  Add Resolved Status
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleUpdateStatus("Invoice Sent")}>
                  Add Invoice Sent Status
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleUpdateStatus("Invoice Paid")}>
                  Add Invoice Paid Status
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleUpdateStatus("Complaint")}>
                  Add Complaint Status
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
        </div>
      </TableCell>
    </TableRow>
  );
};

export default OrderRow;
