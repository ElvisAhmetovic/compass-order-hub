
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { PaymentService, PaymentLink } from "@/services/paymentService";
import { InvoiceService } from "@/services/invoiceService";
import { formatCurrency } from "@/utils/currencyUtils";
import { CreditCard, AlertCircle, RefreshCw, Plus, Trash2 } from "lucide-react";
import PaymentGatewaySelector, { PaymentGateway } from "@/components/payments/PaymentGatewaySelector";

interface PaymentTrackerProps {
  invoiceId: string;
  currency: string;
  amount?: number;
  onPaymentStatusChange?: (status: string) => void;
}

const PaymentTracker: React.FC<PaymentTrackerProps> = ({
  invoiceId,
  currency,
  amount = 0,
  onPaymentStatusChange
}) => {
  const [paymentLinks, setPaymentLinks] = useState<PaymentLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showGatewaySelector, setShowGatewaySelector] = useState(false);
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

  const handlePaymentGatewaySelect = async (gateway: PaymentGateway) => {
    setCreating(true);
    try {
      const paymentLink = await PaymentService.createPaymentLink(invoiceId, gateway.type);
      
      toast({
        title: "Payment link created",
        description: `${gateway.name} payment link has been generated successfully.`,
      });

      setPaymentLinks([paymentLink, ...paymentLinks]);
      setShowGatewaySelector(false);
    } catch (error) {
      console.error("Error creating payment link:", error);
      toast({
        title: "Payment Service Unavailable",
        description: `${gateway.name} payment link creation is not available at the moment.`,
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDeletePaymentLink = async (linkId: string) => {
    setDeleting(linkId);
    try {
      await PaymentService.deletePaymentLink(linkId);
      
      toast({
        title: "Payment link removed",
        description: "Payment link has been removed successfully.",
      });

      setPaymentLinks(paymentLinks.filter(link => link.id !== linkId));
    } catch (error) {
      console.error("Error deleting payment link:", error);
      toast({
        title: "Error",
        description: "Failed to remove payment link. Please try again.",
        variant: "destructive"
      });
    } finally {
      setDeleting(null);
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
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Tracking
            </CardTitle>
            <Button
              onClick={() => setShowGatewaySelector(!showGatewaySelector)}
              disabled={creating}
              size="sm"
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-2" />
              {creating ? "Creating..." : "New Payment Link"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {paymentLinks.length > 0 ? (
            paymentLinks.map((link) => (
              <div key={link.id} className="p-3 border rounded-md">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{link.payment_method.toUpperCase()}</span>
                    <Badge variant={
                      link.status === 'paid' ? 'default' :
                      link.status === 'active' ? 'secondary' :
                      'destructive'
                    }>
                      {link.status.toUpperCase()}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeletePaymentLink(link.id)}
                    disabled={deleting === link.id}
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
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

      {showGatewaySelector && (
        <PaymentGatewaySelector
          amount={amount}
          currency={currency}
          onPaymentSelect={handlePaymentGatewaySelect}
        />
      )}
    </div>
  );
};

export default PaymentTracker;
