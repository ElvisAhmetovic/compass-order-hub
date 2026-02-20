import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, FileText, Send, Receipt, ArrowLeft, X, Bell, Mail, AlertCircle } from "lucide-react";
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
import { PaymentReminderService, PaymentReminder } from "@/services/paymentReminderService";
import MultiStatusBadges from "./MultiStatusBadges";
import { formatCurrency } from "@/utils/currencyUtils";
import ScheduleReminderModal from "@/components/orders/ScheduleReminderModal";
import SendClientReminderModal from "@/components/orders/SendClientReminderModal";

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
  const [isMovingToYearly, setIsMovingToYearly] = useState(false);
  const [isMovingToActive, setIsMovingToActive] = useState(false);
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const [isRemovingReview, setIsRemovingReview] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showClientReminderModal, setShowClientReminderModal] = useState(false);
  const [activeReminder, setActiveReminder] = useState<PaymentReminder | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === "admin";

  // Fetch reminder status for this order
  useEffect(() => {
    const fetchReminder = async () => {
      try {
        const reminder = await PaymentReminderService.getReminderForOrder(order.id);
        setActiveReminder(reminder);
      } catch (error) {
        console.error("Error fetching reminder:", error);
      }
    };
    fetchReminder();
  }, [order.id]);

  const handleReminderUpdated = async () => {
    try {
      const reminder = await PaymentReminderService.getReminderForOrder(order.id);
      setActiveReminder(reminder);
    } catch (error) {
      console.error("Error refreshing reminder:", error);
    }
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

  const handleCreateInvoice = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to create invoices.",
        variant: "destructive"
      });
      return;
    }

    setIsCreatingInvoice(true);
    
    try {
      console.log(`Creating invoice for order ${order.id}`);
      
      // Create invoice from order with draft status
      await createInvoiceFromOrder(order.id, order, "Invoice Sent");
      
      console.log('Invoice created successfully');
      
      // Show success message
      toast({
        title: "Invoice Created",
        description: `Invoice has been created for order from ${order.company_name}.`
      });
      
      // Trigger refresh
      onRefresh();
      window.dispatchEvent(new CustomEvent('orderStatusChanged'));
      
    } catch (error) {
      console.error("Error creating invoice:", error);
      toast({
        title: "Error",
        description: "Failed to create invoice. Please check your connection and try again.",
        variant: "destructive"
      });
    } finally {
      setIsCreatingInvoice(false);
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

    setIsRemovingReview(true);
    try {
      await OrderService.toggleOrderStatus(order.id, "Review", false);
      
      toast({
        title: "Order removed from review",
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
      setIsRemovingReview(false);
    }
  };

  const handleMoveToYearlyPackages = async () => {
    if (!isAdmin) {
      toast({
        title: "Permission Denied",
        description: "Only administrators can move orders to yearly packages.",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to move orders.",
        variant: "destructive"
      });
      return;
    }

    if (order.is_yearly_package) {
      toast({
        title: "Already a Yearly Package",
        description: "This order is already marked as a yearly package.",
        variant: "destructive"
      });
      return;
    }

    setIsMovingToYearly(true);
    try {
      // Update order to mark it as yearly package
      await OrderService.updateOrder(order.id, { is_yearly_package: true });
      
      toast({
        title: "Order moved to yearly packages",
        description: `Order has been moved to the Yearly Packages section.`,
      });
      
      onRefresh();
      window.dispatchEvent(new CustomEvent('orderStatusChanged'));
    } catch (error) {
      console.error("Error moving order to yearly packages:", error);
      toast({
        title: "Error",
        description: "Failed to move order to yearly packages. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsMovingToYearly(false);
    }
  };

  const handleMoveToActiveOrders = async () => {
    if (!isAdmin) {
      toast({
        title: "Permission Denied",
        description: "Only administrators can move orders to active orders.",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to move orders.",
        variant: "destructive"
      });
      return;
    }

    if (!order.is_yearly_package) {
      toast({
        title: "Not a Yearly Package",
        description: "This order is not a yearly package.",
        variant: "destructive"
      });
      return;
    }

    setIsMovingToActive(true);
    try {
      // Update order to remove yearly package flag
      await OrderService.updateOrder(order.id, { is_yearly_package: false });
      
      toast({
        title: "Order moved to active orders",
        description: `Order has been moved to the Dashboard/Active Orders section.`,
      });
      
      onRefresh();
      window.dispatchEvent(new CustomEvent('orderStatusChanged'));
    } catch (error) {
      console.error("Error moving order to active orders:", error);
      toast({
        title: "Error",
        description: "Failed to move order to active orders. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsMovingToActive(false);
    }
  };

  return (
    <TableRow>
      <TableCell className="min-w-0">
        <div className="flex items-start gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onOrderClick(order)}
            className="px-2 h-7 flex-shrink-0 mt-0.5"
          >
            <FileText className="h-4 w-4 mr-1" />
            <span className="sr-only">View Details</span>
          </Button>
          <div className="font-medium break-words leading-tight min-w-0 flex-1">
            {order.company_name}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="font-medium break-words leading-tight">
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
        {formatCurrency(order.price || 0, order.currency || "EUR")}
      </TableCell>
      <TableCell>
        <MultiStatusBadges order={order} onRefresh={onRefresh} compact={true} />
      </TableCell>
      <TableCell>
        {formatDate(order.updated_at)}
      </TableCell>
      <TableCell>
        <div className="flex flex-col items-start gap-1">
          {/* Remove from Review button - visible for admins on orders in Review status */}
          {isAdmin && order.status_review && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveFromReview();
              }}
              disabled={isRemovingReview}
              className="h-8 px-2 w-full"
            >
              <X className="h-4 w-4 mr-1" />
              {isRemovingReview ? "Removing..." : "Remove Review"}
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

          {/* Move to Yearly Packages button - visible for admins on regular orders only */}
          {isAdmin && !order.is_yearly_package && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleMoveToYearlyPackages();
              }}
              disabled={isMovingToYearly}
              className="h-8 px-2 w-full"
            >
              {isMovingToYearly ? "Moving..." : "→ Yearly"}
            </Button>
          )}

          {/* Move to Active Orders button - visible for admins on yearly packages only */}
          {isAdmin && order.is_yearly_package && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleMoveToActiveOrders();
              }}
              disabled={isMovingToActive}
              className="h-8 px-2 w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              {isMovingToActive ? "Moving..." : "→ Active"}
            </Button>
          )}

          {/* Set Payment Reminder button (internal team) */}
          <Button
            variant={activeReminder ? "default" : "outline"}
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setShowReminderModal(true);
            }}
            className={`h-8 px-2 w-full ${activeReminder ? "bg-amber-500 hover:bg-amber-600 text-white" : ""}`}
          >
            <Bell className="h-4 w-4 mr-1" />
            {activeReminder ? "Reminder Set" : "Reminder"}
          </Button>

          {/* Send Client Reminder button */}
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setShowClientReminderModal(true);
            }}
            className={`h-8 px-2 w-full ${!order.contact_email ? "border-amber-500 text-amber-600" : "border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"}`}
            title={!order.contact_email ? "No client email on this order" : "Send reminder to client"}
          >
            {!order.contact_email ? (
              <AlertCircle className="h-4 w-4 mr-1" />
            ) : (
              <Mail className="h-4 w-4 mr-1" />
            )}
            To Client
          </Button>

          {/* Create Invoice button - visible to all users */}
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleCreateInvoice();
            }}
            disabled={isCreatingInvoice}
            className="h-8 px-2 w-full"
          >
            <Receipt className="h-4 w-4 mr-1" />
            {isCreatingInvoice ? "Creating..." : "Invoice"}
          </Button>
          
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

      {/* Payment Reminder Modal (internal team) */}
      <ScheduleReminderModal
        open={showReminderModal}
        onOpenChange={setShowReminderModal}
        order={order}
        existingReminder={activeReminder}
        onReminderUpdated={handleReminderUpdated}
      />

      {/* Send Client Reminder Modal */}
      <SendClientReminderModal
        open={showClientReminderModal}
        onOpenChange={setShowClientReminderModal}
        order={order}
      />
    </TableRow>
  );
};

export default OrderRow;
