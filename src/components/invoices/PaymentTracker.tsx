
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PaymentService, PaymentLink } from "@/services/paymentService";
import { formatCurrency } from "@/utils/currencyUtils";
import { RefreshCw, ExternalLink, Copy, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  const [refreshing, setRefreshing] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadPaymentLinks();
  }, [invoiceId]);

  const loadPaymentLinks = async () => {
    try {
      setLoading(true);
      const links = await PaymentService.getPaymentLinks(invoiceId);
      setPaymentLinks(links);
    } catch (error) {
      console.error("Error loading payment links:", error);
      toast({
        title: "Error",
        description: "Failed to load payment information.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshPaymentStatus = async (paymentLinkId: string) => {
    try {
      setRefreshing(paymentLinkId);
      const updatedLink = await PaymentService.refreshPaymentStatus(paymentLinkId);
      
      setPaymentLinks(links => 
        links.map(link => 
          link.id === paymentLinkId ? updatedLink : link
        )
      );

      if (updatedLink.status === 'paid' && onPaymentStatusChange) {
        onPaymentStatusChange('paid');
      }

      toast({
        title: "Status updated",
        description: `Payment status refreshed: ${updatedLink.status}`,
      });
    } catch (error) {
      console.error("Error refreshing payment status:", error);
      toast({
        title: "Error",
        description: "Failed to refresh payment status.",
        variant: "destructive",
      });
    } finally {
      setRefreshing(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Payment link copied to clipboard.",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'default';
      case 'active':
        return 'secondary';
      case 'expired':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusIcon = (method: string) => {
    switch (method) {
      case 'stripe':
        return <CreditCard className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Payment Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading payment information...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          Payment Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {paymentLinks.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No payment links available
          </div>
        ) : (
          paymentLinks.map((link) => (
            <div key={link.id} className="border rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(link.payment_method)}
                  <span className="font-medium text-sm">
                    {link.payment_method.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusColor(link.status)}>
                    {link.status.toUpperCase()}
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => refreshPaymentStatus(link.id)}
                    disabled={refreshing === link.id}
                  >
                    <RefreshCw className={`h-3 w-3 ${refreshing === link.id ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                Amount: {formatCurrency(link.amount, link.currency)}
              </div>

              {link.status === 'paid' && link.paid_at && (
                <div className="text-sm text-green-600">
                  Paid on {new Date(link.paid_at).toLocaleDateString()}
                  {link.transaction_id && (
                    <span className="block text-xs">
                      Transaction ID: {link.transaction_id}
                    </span>
                  )}
                </div>
              )}

              {link.status === 'active' && (
                <div className="flex items-center gap-1">
                  <div className="flex-1 bg-muted rounded px-2 py-1 text-xs font-mono">
                    {link.payment_url.length > 50 
                      ? `${link.payment_url.substring(0, 50)}...` 
                      : link.payment_url
                    }
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(link.payment_url)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => window.open(link.payment_url, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              )}

              {link.expires_at && new Date(link.expires_at) > new Date() && (
                <div className="text-xs text-muted-foreground">
                  Expires: {new Date(link.expires_at).toLocaleDateString()}
                </div>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentTracker;
