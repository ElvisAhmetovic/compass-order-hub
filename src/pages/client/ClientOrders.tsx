import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import ClientLayout from "@/components/client-portal/ClientLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Eye, Package, Wifi, WifiOff } from "lucide-react";
import { fetchClientOrders, ClientOrder } from "@/services/clientOrderService";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { getClientStatusFromOrder } from "@/utils/clientStatusTranslator";
import { useClientOrdersRealtime } from "@/hooks/useClientOrdersRealtime";

const getStatusBadge = (order: ClientOrder) => {
  const config = getClientStatusFromOrder(order);
  return (
    <Badge 
      variant={config.badgeVariant}
      className={config.badgeClassName}
    >
      {config.emoji} {config.label}
    </Badge>
  );
};

const ClientOrders = () => {
  const [orders, setOrders] = useState<ClientOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatedOrderId, setUpdatedOrderId] = useState<string | null>(null);
  const { toast } = useToast();

  const loadOrders = useCallback(async () => {
    try {
      const data = await fetchClientOrders();
      setOrders(data);
    } catch (error) {
      console.error("Error loading orders:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load orders"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Set up realtime subscription
  const { isConnected } = useClientOrdersRealtime({
    onOrderUpdate: (orderId) => {
      console.log("[ClientOrders] Realtime update received for order:", orderId);
      setUpdatedOrderId(orderId);
      loadOrders();
      // Clear the highlight after animation
      setTimeout(() => setUpdatedOrderId(null), 2000);
    },
    showToast: true,
  });

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  if (isLoading) {
    return (
      <ClientLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Your Orders</h1>
            <p className="text-muted-foreground mt-1">
              View and track your order history
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {isConnected ? (
              <>
                <Wifi className="h-3 w-3 text-primary" />
                <span className="hidden sm:inline">Live updates</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3 text-muted-foreground" />
                <span className="hidden sm:inline">Connecting...</span>
              </>
            )}
          </div>
        </div>

        {orders.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No orders found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your orders will appear here once they are created.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {orders.map((order) => (
              <Card 
                key={order.id} 
                className={`hover:shadow-md transition-all duration-300 ${
                  updatedOrderId === order.id 
                    ? "ring-2 ring-primary ring-offset-2 ring-offset-background" 
                    : ""
                }`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{order.company_name}</CardTitle>
                    {getStatusBadge(order)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {order.description && (
                        <p className="line-clamp-2">{order.description}</p>
                      )}
                      <p>Created: {format(new Date(order.created_at), "PPP")}</p>
                      {order.price && (
                        <p className="font-medium text-foreground">
                          {order.currency || "EUR"} {order.price.toFixed(2)}
                        </p>
                      )}
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/client/orders/${order.id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ClientLayout>
  );
};

export default ClientOrders;
