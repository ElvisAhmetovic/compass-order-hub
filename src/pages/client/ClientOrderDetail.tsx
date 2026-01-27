import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import ClientLayout from "@/components/client-portal/ClientLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, ArrowLeft, CheckCircle, Clock, FileText, XCircle, Paperclip, Download, ExternalLink, Megaphone, AlertTriangle } from "lucide-react";
import { fetchClientOrderById, getOrderAttachments, ClientOrder, OrderAttachment } from "@/services/clientOrderService";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { getClientStatusFromOrder, getClientStatusStep, getActionButtonConfig } from "@/utils/clientStatusTranslator";

const ClientOrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<ClientOrder | null>(null);
  const [attachments, setAttachments] = useState<OrderAttachment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadOrder = async () => {
      if (!id) return;
      
      try {
        const [orderData, attachmentData] = await Promise.all([
          fetchClientOrderById(id),
          getOrderAttachments(id).catch(() => [] as OrderAttachment[])
        ]);
        setOrder(orderData);
        setAttachments(attachmentData);
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

  const statusConfig = getClientStatusFromOrder(order);
  const actionConfig = getActionButtonConfig(order);
  const isCancelled = order.status_cancelled;

  // Build status steps with client-friendly labels
  const statusSteps = [
    { ...getClientStatusStep("created", !!order.status_created), icon: Clock },
    { ...getClientStatusStep("in_progress", !!order.status_in_progress), icon: Clock },
    { ...getClientStatusStep("invoice_sent", !!order.status_invoice_sent), icon: FileText },
    { ...getClientStatusStep("invoice_paid", !!order.status_invoice_paid), icon: CheckCircle },
    { ...getClientStatusStep("resolved", !!order.status_resolved), icon: CheckCircle },
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
            {/* Action Required Card - Most prominent placement */}
            {actionConfig.showButton && actionConfig.url && (
              <Card className="border-destructive/50 bg-destructive/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                    Action Required
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-foreground">
                    Your feedback is needed to proceed with this order. Please review and provide your input.
                  </p>
                  <Button
                    asChild
                    variant="destructive"
                    size="lg"
                    className="w-full sm:w-auto"
                  >
                    <a 
                      href={actionConfig.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      {actionConfig.label}
                    </a>
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Opens: {actionConfig.url}
                  </p>
                </CardContent>
              </Card>
            )}
            
            {/* Client Visible Update Card - Prominent placement */}
            {order.client_visible_update && (
              <Card className="border-primary/30 bg-primary/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2 text-primary">
                    <Megaphone className="h-5 w-5" />
                    Latest Update
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                    {order.client_visible_update}
                  </p>
                  {order.updated_at && (
                    <p className="text-xs text-muted-foreground mt-3">
                      Last updated: {format(new Date(order.updated_at), "PPP 'at' p")}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
            {/* Order Info Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{order.company_name}</CardTitle>
                  <Badge 
                    variant={statusConfig.badgeVariant}
                    className={statusConfig.badgeClassName}
                  >
                    {statusConfig.emoji} {statusConfig.label}
                  </Badge>
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

            {/* Progress Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Order Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Progress Bar */}
                {!isCancelled && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Overall Progress</span>
                      <span className="font-medium text-foreground">{statusConfig.progress}%</span>
                    </div>
                    <Progress value={statusConfig.progress} className="h-3" />
                    <p className="text-sm text-muted-foreground">
                      Current status: <span className="font-medium text-foreground">{statusConfig.emoji} {statusConfig.label}</span>
                    </p>
                  </div>
                )}

                {/* Status Steps */}
                <div className="flex flex-wrap gap-3 pt-2">
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

            {/* Attachments Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Paperclip className="h-5 w-5" />
                  Attachments
                </CardTitle>
              </CardHeader>
              <CardContent>
                {attachments.length > 0 ? (
                  <div className="space-y-2">
                    {attachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="font-medium text-sm text-foreground truncate">{attachment.file_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {attachment.file_size ? `${(attachment.file_size / 1024).toFixed(1)} KB` : 'Unknown size'} 
                              {' • '}{format(new Date(attachment.created_at), "MMM d, yyyy")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            asChild
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <a href={attachment.file_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                          <Button
                            asChild
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <a href={attachment.file_url} download={attachment.file_name}>
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    <Paperclip className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No attachments for this order</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
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
