
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Order, User } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { OrderService } from "@/services/orderService";
import { supabase } from "@/integrations/supabase/client";

interface AssignOrdersModalProps {
  user: User;
  open: boolean;
  onClose: () => void;
}

export function AssignOrdersModal({ user, open, onClose }: AssignOrdersModalProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();
  
  // Check if user is a client (for client linking vs internal assignment)
  const isClientUser = user.role === "client";
  
  // Load orders from Supabase
  useEffect(() => {
    if (open) {
      loadOrders();
    }
  }, [open, user]);
  
  const loadOrders = async () => {
    setLoading(true);
    try {
      const allOrders = await OrderService.getOrders();
      setOrders(allOrders);
      
      // Pre-select orders based on user type
      // For clients: pre-select orders where client_id matches
      // For internal users: pre-select orders where assigned_to matches
      const userOrders = allOrders
        .filter((order: Order) => 
          isClientUser 
            ? order.client_id === user.id 
            : order.assigned_to === user.id
        )
        .map((order: Order) => order.id);
      
      setSelectedOrders(userOrders);
    } catch (error) {
      console.error("Error loading orders:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load orders from database."
      });
    } finally {
      setLoading(false);
    }
  };
  
  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrders(prev => 
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };
  
  const handleAssignOrders = async () => {
    setIsSubmitting(true);
    try {
      const userName = user.full_name || user.email || 'Unknown User';
      
      // Process each order based on user type
      for (const order of orders) {
        const isSelected = selectedOrders.includes(order.id);
        
        if (isClientUser) {
          // For clients: update client_id field
          if (isSelected && order.client_id !== user.id) {
            // Link client to order
            await supabase
              .from("orders")
              .update({ client_id: user.id, updated_at: new Date().toISOString() })
              .eq("id", order.id);
          } else if (!isSelected && order.client_id === user.id) {
            // Unlink client from order
            await supabase
              .from("orders")
              .update({ client_id: null, updated_at: new Date().toISOString() })
              .eq("id", order.id);
          }
        } else {
          // For internal users: update assigned_to field (existing behavior)
          if (isSelected && order.assigned_to !== user.id) {
            await OrderService.assignOrder(order.id, user.id, userName);
          } else if (!isSelected && order.assigned_to === user.id) {
            await OrderService.unassignOrder(order.id);
          }
        }
      }
      
      toast({
        title: isClientUser ? "Orders linked" : "Orders assigned",
        description: isClientUser 
          ? `Successfully updated client access for ${userName}.`
          : `Successfully updated order assignments for ${userName}.`,
      });
      
      onClose();
    } catch (error) {
      console.error("Error assigning orders:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update orders. Please try again."
      });
    } finally {
      setIsSubmitting(false);
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
    return statusClasses[status as keyof typeof statusClasses] || "bg-gray-500 text-white";
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md md:max-w-lg max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {isClientUser ? "Link Orders to Client" : "Assign Orders to"} {user.full_name || user.email}
          </DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="py-6 flex justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <>
            <div className="py-2">
              <p className="text-sm text-muted-foreground mb-4">
                {isClientUser 
                  ? `Select orders to grant client portal access. Currently showing ${orders.length} orders.`
                  : `Select orders to assign to this user. Currently showing ${orders.length} orders.`
                }
              </p>
              
              {orders.length > 0 ? (
                <ScrollArea className="h-[50vh]">
                  <div className="space-y-2">
                    {orders.map(order => (
                      <div 
                        key={order.id} 
                        className="flex items-center space-x-2 p-2 border rounded-md hover:bg-accent"
                      >
                        <Checkbox 
                          id={`order-${order.id}`}
                          checked={selectedOrders.includes(order.id)}
                          onCheckedChange={() => toggleOrderSelection(order.id)}
                        />
                        <div className="flex flex-1 justify-between items-center">
                          <Label 
                            htmlFor={`order-${order.id}`}
                            className="flex-1 cursor-pointer text-sm"
                          >
                            <span className="font-medium">{order.company_name}</span>
                            {order.contact_email && (
                              <span className="ml-2 text-muted-foreground">{order.contact_email}</span>
                            )}
                          </Label>
                          
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(order.status)}>
                              {order.status}
                            </Badge>
                            <Badge variant="outline">
                              {new Intl.NumberFormat('en-US', { 
                                style: 'currency', 
                                currency: order.currency || 'USD' 
                              }).format(order.price || 0)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <p className="text-center py-8 text-muted-foreground">
                  No orders available to assign.
                </p>
              )}
            </div>
            
            <div className="flex justify-between mt-4 pt-4 border-t">
              <div>
                <p className="text-sm font-medium">
                  {selectedOrders.length} orders selected
                </p>
              </div>
              <div className="space-x-2">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleAssignOrders}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving..." : "Save Assignments"}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
