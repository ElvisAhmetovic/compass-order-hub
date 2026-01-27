import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ClientLayout from "@/components/client-portal/ClientLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Eye, Package } from "lucide-react";
import { fetchClientOrders, ClientOrder } from "@/services/clientOrderService";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const getStatusBadge = (order: ClientOrder) => {
  if (order.status_resolved) return <Badge className="bg-primary text-primary-foreground">Resolved</Badge>;
  if (order.status_invoice_paid) return <Badge className="bg-primary/80 text-primary-foreground">Paid</Badge>;
  if (order.status_invoice_sent) return <Badge className="bg-accent text-accent-foreground">Invoice Sent</Badge>;
  if (order.status_in_progress) return <Badge className="bg-secondary text-secondary-foreground">In Progress</Badge>;
  if (order.status_cancelled) return <Badge variant="destructive">Cancelled</Badge>;
  if (order.status_created) return <Badge variant="secondary">Created</Badge>;
  return <Badge variant="outline">{order.status}</Badge>;
};

const ClientOrders = () => {
  const [orders, setOrders] = useState<ClientOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadOrders = async () => {
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
    };

    loadOrders();
  }, [toast]);

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
        <div>
          <h1 className="text-3xl font-bold text-foreground">Your Orders</h1>
          <p className="text-muted-foreground mt-1">
            View and track your order history
          </p>
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
              <Card key={order.id} className="hover:shadow-md transition-shadow">
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
