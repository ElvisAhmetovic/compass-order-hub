import { useState } from "react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, FileText, AlertTriangle } from "lucide-react";
import { Order, OrderStatus } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { InvoiceService } from "@/services/invoiceService";
import { v4 as uuidv4 } from "uuid";

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
        // Create new client
        const newClient = await InvoiceService.createClient({
          name: orderData.company_name,
          email: orderData.contact_email || `${orderData.company_name.toLowerCase().replace(/\s+/g, '')}@company.com`,
          address: orderData.company_address || '',
          phone: orderData.contact_phone || '',
        });
        clientId = newClient.id;
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
        description: "Failed to create invoice from order.",
        variant: "destructive"
      });
    }
  };

  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (!isAdmin) {
      toast({
        title: "Permission Denied",
        description: "Only administrators can change order status.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Get existing orders
      const orders = JSON.parse(localStorage.getItem("orders") || "[]");
      
      // Find and update the order
      const updatedOrders = orders.map((o: Order) => 
        o.id === order.id ? { 
          ...o, 
          status: newStatus, 
          updated_at: new Date().toISOString() 
        } : o
      );
      
      // Save updated orders back to localStorage
      localStorage.setItem("orders", JSON.stringify(updatedOrders));
      
      // Update status history
      const allStatusHistories = JSON.parse(localStorage.getItem("statusHistories") || "{}");
      const orderHistory = allStatusHistories[order.id] || [];
      
      const newStatusHistoryItem = {
        id: `sh${Date.now()}`,
        order_id: order.id,
        status: newStatus,
        changed_by: user?.full_name || user?.email || "Unknown User",
        changed_at: new Date().toISOString(),
        notes: `Status changed to ${newStatus} using quick action`
      };
      
      allStatusHistories[order.id] = [newStatusHistoryItem, ...orderHistory];
      localStorage.setItem("statusHistories", JSON.stringify(allStatusHistories));
      
      // Create invoice if status is invoice-related
      if (newStatus === "Invoice Sent" || newStatus === "Invoice Paid") {
        await createInvoiceFromOrder(order.id, order, newStatus);
      }
      
      // Show success message
      toast({
        title: "Status updated",
        description: `Order status changed to "${newStatus}".`
      });
      
      // Trigger refresh
      onRefresh();
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "Failed to update order status.",
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

    if (!window.confirm("Are you sure you want to delete this order?")) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // In a real app, this would be an API call
      // For now, we'll update localStorage
      
      // Get existing orders
      const orders = JSON.parse(localStorage.getItem("orders") || "[]");
      
      // Filter out the deleted order
      const updatedOrders = orders.filter((o: Order) => o.id !== order.id);
      
      // Save updated orders back to localStorage
      localStorage.setItem("orders", JSON.stringify(updatedOrders));
      
      // Show success message
      toast({
        title: "Order deleted",
        description: "The order has been deleted successfully."
      });
      
      // Trigger refresh
      onRefresh();
    } catch (error) {
      console.error("Error deleting order:", error);
      toast({
        title: "Error",
        description: "Failed to delete the order.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onOrderView(order)}>
        <FileText className="h-4 w-4" />
      </Button>
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
        
        <DropdownMenuItem onClick={() => handleStatusChange("In Progress")}>
          Mark as In Progress
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleStatusChange("Complaint")}>
          Register Complaint
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleStatusChange("Invoice Sent")}>
          Mark as Invoice Sent
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleStatusChange("Invoice Paid")}>
          Mark as Invoice Paid
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleStatusChange("Resolved")}>
          Mark as Resolved
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleStatusChange("Cancelled")}>
          Mark as Cancelled
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
