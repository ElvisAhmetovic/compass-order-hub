import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import ClientLayout from "@/components/client-portal/ClientLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, CheckCircle, Clock, FileText, XCircle } from "lucide-react";
import { fetchClientOrderById, ClientOrder } from "@/services/clientOrderService";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const ClientOrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<ClientOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadOrder = async () => {
      if (!id) return;
      
      try {
        const data = await fetchClientOrderById(id);
        setOrder(data);
      } catch (error) {
        console.error("Error loading order:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load order details"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadOrder();
  }, [id, toast]);

  if (isLoading) {
    return (
      <ClientLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ClientLayout>
    );
  }

  if (!order) {
    return (
      <ClientLayout>
        <div className="space-y-4">
          <Button asChild variant="ghost">
            <Link to="/client/orders">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Link>
          </Button>
          <Card className="border-dashed">
            <CardContent className="py-12 text-center text-muted-foreground">
              Order not found or you don't have access to view it.
            </CardContent>
          </Card>
        </div>
      </ClientLayout>
    );
  }

  const statusSteps = [
    { key: "created", label: "Created", active: order.status_created, icon: Clock },
    { key: "in_progress", label: "In Progress", active: order.status_in_progress, icon: Clock },
    { key: "invoice_sent", label: "Invoice Sent", active: order.status_invoice_sent, icon: FileText },
    { key: "invoice_paid", label: "Paid", active: order.status_invoice_paid, icon: CheckCircle },
    { key: "resolved", label: "Completed", active: order.status_resolved, icon: CheckCircle },
  ];

  return (
    <ClientLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="sm">
            <Link to="/client/orders">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Order Details</h1>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{order.company_name}</CardTitle>
                  {order.status_cancelled ? (
                    <Badge variant="destructive">Cancelled</Badge>
                  ) : order.status_resolved ? (
                    <Badge className="bg-green-500">Completed</Badge>
                  ) : (
                    <Badge variant="secondary">Active</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {order.description && (
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">Description</h3>
                    <p className="text-foreground">{order.description}</p>
                  </div>
                )}
                
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">Created</h3>
                    <p>{format(new Date(order.created_at), "PPP")}</p>
                  </div>
                  {order.updated_at && (
                    <div>
                      <h3 className="font-medium text-sm text-muted-foreground mb-1">Last Updated</h3>
                      <p>{format(new Date(order.updated_at), "PPP")}</p>
                    </div>
                  )}
                  {order.price && (
                    <div>
                      <h3 className="font-medium text-sm text-muted-foreground mb-1">Price</h3>
                      <p className="text-lg font-semibold">
                        {order.currency || "EUR"} {order.price.toFixed(2)}
                      </p>
                    </div>
                  )}
                  {order.priority && (
                    <div>
                      <h3 className="font-medium text-sm text-muted-foreground mb-1">Priority</h3>
                      <Badge variant="outline">{order.priority}</Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Order Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {statusSteps.map((step) => (
                    <div
                      key={step.key}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                        step.active
                          ? "bg-primary/10 border-primary text-foreground"
                          : "bg-muted/50 border-border text-muted-foreground"
                      }`}
                    >
                      <step.icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{step.label}</span>
                      {step.active && <CheckCircle className="h-4 w-4 text-primary" />}
                    </div>
                  ))}
                  {order.status_cancelled && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-destructive bg-destructive/10 text-destructive">
                      <XCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Cancelled</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {order.contact_email && (
                  <div>
                    <span className="text-muted-foreground">Email:</span>
                    <p className="font-medium">{order.contact_email}</p>
                  </div>
                )}
                {order.contact_phone && (
                  <div>
                    <span className="text-muted-foreground">Phone:</span>
                    <p className="font-medium">{order.contact_phone}</p>
                  </div>
                )}
                {order.company_email && (
                  <div>
                    <span className="text-muted-foreground">Company Email:</span>
                    <p className="font-medium">{order.company_email}</p>
                  </div>
                )}
                {!order.contact_email && !order.contact_phone && !order.company_email && (
                  <p className="text-muted-foreground">No contact information available</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ClientLayout>
  );
};

export default ClientOrderDetail;
