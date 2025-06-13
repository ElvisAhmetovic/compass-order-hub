
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { PaymentService, PaymentLink } from "@/services/paymentService";
import { InvoiceService } from "@/services/invoiceService";
import { formatCurrency } from "@/utils/currencyUtils";
import { CreditCard, AlertCircle, RefreshCw } from "lucide-react";

interface PaymentTrackerProps {
  invoiceId: string;
  currency: string;
  onPaymentStatusChange?: (status: string) => void;
}

const PaymentTracker: React.FC<PaymentTrackerProps> = ({
  invoiceId,
  currency,
  onPaymentStatusChange
}) => {
  const [paymentLinks, setPaymentLinks] = useState<PaymentLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadPaymentData();
  }, [invoiceId]);

  const loadPaymentData = async () => {
    if (!invoiceId) {
      setLoading(false);
      setError("No invoice ID provided");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Try to load payment links, but don't fail if the service isn't available
      try {
        const links = await PaymentService.getPaymentLinks(invoiceId);
        setPaymentLinks(links || []);
      } catch (paymentError) {
        console.warn("Payment service not available:", paymentError);
        setPaymentLinks([]);
      }

    } catch (error) {
      console.error("Error loading payment data:", error);
      setError("Unable to load payment information");
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePaymentLink = async (method: string = 'stripe') => {
    setCreating(true);
    try {
      const paymentLink = await PaymentService.createPaymentLink(invoiceId, method);
      
      toast({
        title: "Payment link created",
        description: "Payment link has been generated successfully.",
      });

      setPaymentLinks([paymentLink, ...paymentLinks]);
    } catch (error) {
      console.error("Error creating payment link:", error);
      toast({
        title: "Payment Service Unavailable",
        description: "Payment link creation is not available at the moment.",
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  const handleRetry = () => {
    loadPaymentData();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            Loading payment information...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-3">
              Payment information is currently unavailable
            </p>
            <Button variant="outline" size="sm" onClick={handleRetry}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Tracking
          </CardTitle>
          <Button
            onClick={() => handleCreatePaymentLink('stripe')}
            disabled={creating}
            size="sm"
            variant="outline"
          >
            {creating ? "Creating..." : "Create Payment Link"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {paymentLinks.length > 0 ? (
          paymentLinks.map((link) => (
            <div key={link.id} className="p-3 border rounded-md">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{link.payment_method.toUpperCase()}</span>
                <Badge variant={
                  link.status === 'paid' ? 'default' :
                  link.status === 'active' ? 'secondary' :
                  'destructive'
                }>
                  {link.status.toUpperCase()}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                Amount: {formatCurrency(link.amount, link.currency)}
              </div>
              <div className="text-sm text-muted-foreground">
                Created: {new Date(link.created_at).toLocaleDateString()}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            <p className="text-sm">No payment links created yet</p>
            <p className="text-xs mt-1">Create a payment link to enable online payments</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentTracker;
