import { useState } from "react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, FileText, AlertTriangle, Receipt } from "lucide-react";
import { Order, OrderStatus } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { InvoiceService } from "@/services/invoiceService";
import { OrderService } from "@/services/orderService";
import { WorkflowService } from "@/services/workflowService";
import { SelectedInventoryItem } from "./InventoryItemsSelector";

interface OrderActionsProps {
  order: Order;
  onOrderView: (order: Order) => void;
  onRefresh: () => void;
}

const OrderActions = ({ order, onOrderView, onRefresh }: OrderActionsProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const isAssignedToUser = user && order.assigned_to === user.id;

  // Check if user has permission to view this order
  const hasPermission = isAdmin || isAssignedToUser;

  // Show warning for non-admin users trying to access unassigned orders
  if (!hasPermission && !isAdmin) {
    return (
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8 text-amber-500" 
        onClick={() => {
          toast({
            title: "Access Restricted",
            description: "You don't have permission to access this order.",
            variant: "destructive"
          });
        }}
      >
        <AlertTriangle className="h-4 w-4" />
      </Button>
    );
  }

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

      // Parse inventory items from order if they exist
      let lineItems = [];
      
      if (orderData.inventory_items) {
        try {
          const inventoryItems: SelectedInventoryItem[] = JSON.parse(orderData.inventory_items);
          lineItems = inventoryItems.map(item => ({
            item_description: item.name || 'Inventory Item', // Use inventory item name
            quantity: item.quantity,
            unit_price: item.unitPrice,
            unit: item.unit,
            vat_rate: 0.19,
            discount_rate: 0
          }));
        } catch (error) {
          console.error("Error parsing inventory items:", error);
        }
      }

      // If no inventory items, use a generic service description (NOT the order description)
      if (lineItems.length === 0) {
        lineItems = [
          {
            item_description: 'Service provided', // Generic description for services
            quantity: 1,
            unit_price: orderData.price || 0,
            unit: 'pcs',
            vat_rate: 0.19,
            discount_rate: 0
          }
        ];
      }

      // Create a new invoice from the order
      const invoiceData = {
        client_id: clientId,
        issue_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
        currency: orderData.currency || 'EUR',
        payment_terms: 'Net 30',
        notes: `Invoice created from order. Order ID: ${orderId}`,
        internal_notes: `Automatically generated from order ${orderId}`,
        line_items: lineItems
      };

      const newInvoice = await InvoiceService.createInvoice(invoiceData);
      
      // Update the invoice status to match the order status
      const invoiceStatus = status === "Invoice Sent" ? "sent" : "paid";
      await InvoiceService.updateInvoice(newInvoice.id, { status: invoiceStatus });
      
      // Trigger workflow automation
      await WorkflowService.handleInvoiceCreated(orderId);
      
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

    setIsLoading(true);
    
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
      setIsLoading(false);
    }
  };

  const handleStatusToggle = async (newStatus: OrderStatus, enabled: boolean) => {
    if (!isAdmin) {
      toast({
        title: "Permission Denied",
        description: "Only administrators can change order status.",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to update order status.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      console.log(`Toggling order ${order.id} status ${newStatus} to ${enabled}`);
      
      // Update order status using Supabase
      await OrderService.toggleOrderStatus(order.id, newStatus, enabled);
      
      console.log('Order status toggled successfully');
      
      // Trigger workflow automation based on status change
      if (enabled) {
        switch (newStatus) {
          case "Invoice Sent":
          case "Invoice Paid":
            await createInvoiceFromOrder(order.id, order, newStatus);
            break;
          case "Resolved":
            if (OrderService.getActiveStatuses(order).includes("Complaint")) {
              await WorkflowService.handleComplaintResolved(order.id);
            }
            break;
          case "Invoice Paid":
            await WorkflowService.handlePaymentReceived(order.id);
            break;
        }
      }
      
      // Show success message
      toast({
        title: enabled ? "Status Added" : "Status Removed",
        description: `Order ${enabled ? 'marked as' : 'unmarked as'} "${newStatus}".`
      });
      
      // Trigger refresh and notify about the status change
      onRefresh();
      window.dispatchEvent(new CustomEvent('orderStatusChanged'));
      
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "Failed to update order status. Please check your connection and try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeleteOrder = async () => {
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

    if (!window.confirm("Are you sure you want to delete this order?")) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Delete order using Supabase
      await OrderService.deleteOrder(order.id);
      
      // Show success message
      toast({
        title: "Order deleted",
        description: "The order has been deleted successfully."
      });
      
      // Trigger refresh and notify about the change
      onRefresh();
      window.dispatchEvent(new CustomEvent('orderStatusChanged'));
    } catch (error) {
      console.error("Error deleting order:", error);
      toast({
        title: "Error",
        description: "Failed to delete the order. Please check your connection and try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
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

    if (!window.confirm("Are you sure you want to move this order to yearly packages?")) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Update order to mark it as yearly package
      await OrderService.updateOrder(order.id, { is_yearly_package: true });
      
      // Show success message
      toast({
        title: "Order Moved",
        description: "The order has been moved to yearly packages successfully."
      });
      
      // Trigger refresh and notify about the change
      onRefresh();
      window.dispatchEvent(new CustomEvent('orderStatusChanged'));
    } catch (error) {
      console.error("Error moving order to yearly packages:", error);
      toast({
        title: "Error",
        description: "Failed to move the order to yearly packages. Please check your connection and try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoAssign = async () => {
    if (!isAdmin) {
      toast({
        title: "Permission Denied",
        description: "Only administrators can assign orders.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      await WorkflowService.autoAssignOrder(order.id);
      
      toast({
        title: "Order Auto-Assigned",
        description: "Order has been automatically assigned based on workload.",
      });
      
      onRefresh();
      window.dispatchEvent(new CustomEvent('orderStatusChanged'));
    } catch (error) {
      console.error("Error auto-assigning order:", error);
      toast({
        title: "Error",
        description: "Failed to auto-assign order. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get currently active statuses
  const activeStatuses = OrderService.getActiveStatuses(order);

  if (!isAdmin) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild disabled={isLoading}>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => onOrderView(order)}>
            View Details
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          {/* Create Invoice option - available to all users */}
          <DropdownMenuItem onClick={handleCreateInvoice} disabled={isLoading}>
            <Receipt className="h-4 w-4 mr-2" />
            Create Invoice
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={isLoading}>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => onOrderView(order)}>
          View Details
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {/* Create Invoice option */}
        <DropdownMenuItem onClick={handleCreateInvoice} disabled={isLoading}>
          <Receipt className="h-4 w-4 mr-2" />
          Create Invoice
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {/* Move to Yearly Packages - only show for regular orders */}
        {!order.is_yearly_package && (
          <>
            <DropdownMenuItem onClick={handleMoveToYearlyPackages}>
              Move to Yearly Packages
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        
        {/* Workflow automation actions */}
        {!order.assigned_to && (
          <DropdownMenuItem onClick={handleAutoAssign}>
            Auto-Assign Order
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator />
        
        {/* Add/Remove status options */}
        <DropdownMenuItem onClick={() => handleStatusToggle("In Progress", !activeStatuses.includes("In Progress"))}>
          {activeStatuses.includes("In Progress") ? "Remove" : "Add"} In Progress
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleStatusToggle("Complaint", !activeStatuses.includes("Complaint"))}>
          {activeStatuses.includes("Complaint") ? "Remove" : "Add"} Complaint
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleStatusToggle("Review", !activeStatuses.includes("Review"))}>
          {activeStatuses.includes("Review") ? "Remove" : "Add"} Review
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleStatusToggle("Invoice Sent", !activeStatuses.includes("Invoice Sent"))}>
          {activeStatuses.includes("Invoice Sent") ? "Remove" : "Add"} Invoice Sent
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleStatusToggle("Invoice Paid", !activeStatuses.includes("Invoice Paid"))}>
          {activeStatuses.includes("Invoice Paid") ? "Remove" : "Add"} Invoice Paid
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleStatusToggle("Resolved", !activeStatuses.includes("Resolved"))}>
          {activeStatuses.includes("Resolved") ? "Remove" : "Add"} Resolved
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleStatusToggle("Cancelled", !activeStatuses.includes("Cancelled"))}>
          {activeStatuses.includes("Cancelled") ? "Remove" : "Add"} Cancelled
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={handleDeleteOrder}
          className="text-red-600 focus:bg-red-50 focus:text-red-600"
        >
          Delete Order
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default OrderActions;
