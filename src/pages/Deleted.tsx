
import React, { useState, useEffect } from 'react';
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/dashboard/Sidebar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, Trash2, AlertTriangle } from "lucide-react";
import { Order } from "@/types";
import { OrderService } from "@/services/orderService";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const Deleted = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [deletedOrders, setDeletedOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [permanentlyDeleting, setPermanentlyDeleting] = useState<string | null>(null);
  
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    fetchDeletedOrders();
  }, []);

  const fetchDeletedOrders = async () => {
    try {
      setLoading(true);
      const orders = await OrderService.getDeletedOrders();
      
      // Filter for non-admin users to only show their assigned orders
      if (!isAdmin && user) {
        const userOrders = orders.filter(order => order.assigned_to === user.id);
        setDeletedOrders(userOrders);
      } else {
        setDeletedOrders(orders);
      }
    } catch (error) {
      console.error("Error fetching deleted orders:", error);
      toast({
        title: "Error",
        description: "Failed to load deleted orders.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (orderId: string) => {
    if (!isAdmin) {
      toast({
        title: "Permission Denied",
        description: "Only administrators can restore orders.",
        variant: "destructive"
      });
      return;
    }

    setRestoring(orderId);
    try {
      await OrderService.restoreOrder(orderId);
      toast({
        title: "Order Restored",
        description: "The order has been successfully restored.",
      });
      fetchDeletedOrders(); // Refresh the list
      // Notify other components about the change
      window.dispatchEvent(new CustomEvent('orderStatusChanged'));
    } catch (error) {
      console.error("Error restoring order:", error);
      toast({
        title: "Error",
        description: "Failed to restore the order.",
        variant: "destructive"
      });
    } finally {
      setRestoring(null);
    }
  };

  const handlePermanentDelete = async (orderId: string, companyName: string) => {
    if (!isAdmin) {
      toast({
        title: "Permission Denied",
        description: "Only administrators can permanently delete orders.",
        variant: "destructive"
      });
      return;
    }

    if (!window.confirm(`Are you sure you want to permanently delete the order for ${companyName}? This action cannot be undone.`)) {
      return;
    }

    setPermanentlyDeleting(orderId);
    try {
      await OrderService.permanentlyDeleteOrder(orderId);
      toast({
        title: "Order Permanently Deleted",
        description: "The order has been permanently removed from the system.",
      });
      fetchDeletedOrders(); // Refresh the list
    } catch (error) {
      console.error("Error permanently deleting order:", error);
      toast({
        title: "Error",
        description: "Failed to permanently delete the order.",
        variant: "destructive"
      });
    } finally {
      setPermanentlyDeleting(null);
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1">
          <Layout userRole="user">
            <div className="flex justify-center items-center h-64">
              <p className="text-muted-foreground">Please log in to access deleted orders.</p>
            </div>
          </Layout>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1">
        <Layout userRole={user?.role || "user"}>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Deleted Orders</h1>
                <p className="text-muted-foreground">
                  Orders that have been deleted can be restored or permanently removed
                </p>
              </div>
              <Badge variant="secondary" className="text-sm">
                {deletedOrders.length} deleted order{deletedOrders.length !== 1 ? 's' : ''}
              </Badge>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                <span className="ml-2">Loading deleted orders...</span>
              </div>
            ) : deletedOrders.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Deleted Orders</h3>
                  <p className="text-muted-foreground">
                    There are no deleted orders to display.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {deletedOrders.map((order) => (
                  <Card key={order.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{order.company_name}</CardTitle>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                            <span>Deleted: {order.deleted_at ? format(new Date(order.deleted_at), 'MMM dd, yyyy HH:mm') : 'Unknown'}</span>
                            <span>Originally created: {format(new Date(order.created_at), 'MMM dd, yyyy')}</span>
                            {order.assigned_to_name && <span>Assigned to: {order.assigned_to_name}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {order.price && (
                            <Badge variant="outline">
                              {order.currency || 'EUR'} {order.price}
                            </Badge>
                          )}
                          {order.priority && (
                            <Badge variant={order.priority === 'high' ? 'destructive' : order.priority === 'medium' ? 'default' : 'secondary'}>
                              {order.priority}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {order.description && (
                          <p className="text-sm text-muted-foreground">{order.description}</p>
                        )}
                        
                        <div className="flex items-center gap-2">
                          {isAdmin && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRestore(order.id)}
                                disabled={restoring === order.id}
                                className="flex items-center gap-2"
                              >
                                <RotateCcw className="h-4 w-4" />
                                {restoring === order.id ? 'Restoring...' : 'Restore'}
                              </Button>
                              
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handlePermanentDelete(order.id, order.company_name)}
                                disabled={permanentlyDeleting === order.id}
                                className="flex items-center gap-2"
                              >
                                <Trash2 className="h-4 w-4" />
                                {permanentlyDeleting === order.id ? 'Deleting...' : 'Delete Permanently'}
                              </Button>
                            </>
                          )}
                          
                          {!isAdmin && (
                            <p className="text-sm text-muted-foreground italic">
                              Contact an administrator to restore this order
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </Layout>
      </div>
    </div>
  );
};

export default Deleted;
