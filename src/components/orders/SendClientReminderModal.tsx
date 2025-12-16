import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Order } from "@/types";
import { formatCurrency } from "@/utils/currencyUtils";
import { formatDate } from "@/lib/utils";
import { Send, AlertCircle, Mail, Phone, Calendar, Building2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SendClientReminderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order;
}

const SendClientReminderModal = ({ open, onOpenChange, order }: SendClientReminderModalProps) => {
  const [customMessage, setCustomMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const hasClientEmail = !!order.contact_email && order.contact_email.trim() !== "";

  const handleSendReminder = async () => {
    if (!hasClientEmail) {
      toast({
        title: "No Client Email",
        description: "This order doesn't have a client email address. Please add one first.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);

    try {
      const { data, error } = await supabase.functions.invoke("send-client-payment-reminder", {
        body: {
          clientEmail: order.contact_email,
          companyName: order.company_name,
          contactPhone: order.contact_phone,
          orderCreatedAt: order.created_at,
          orderDescription: order.description,
          orderPrice: order.price,
          orderCurrency: order.currency || "EUR",
          customMessage: customMessage.trim() || null,
          orderId: order.id,
        },
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Reminder Sent Successfully",
        description: `Payment reminder sent to ${order.contact_email} and team notified.`,
      });

      setCustomMessage("");
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error sending client reminder:", error);
      toast({
        title: "Failed to Send Reminder",
        description: error.message || "An error occurred while sending the reminder.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            Send Payment Reminder to Client
          </DialogTitle>
          <DialogDescription>
            Send a professional payment reminder email to the client and notify your team.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Warning if no email */}
          {!hasClientEmail && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This order doesn't have a client email address. Please edit the order and add the contact email first.
              </AlertDescription>
            </Alert>
          )}

          {/* Order Details Card */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground mb-3">Order Details (included in email)</h4>
            
            <div className="grid gap-2 text-sm">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Company:</span>
                <span className="font-medium">{order.company_name}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Email:</span>
                <span className={`font-medium ${!hasClientEmail ? "text-destructive" : ""}`}>
                  {order.contact_email || "Not provided"}
                </span>
              </div>
              
              {order.contact_phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Phone:</span>
                  <span className="font-medium">{order.contact_phone}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Order Date:</span>
                <span className="font-medium">{formatDate(order.created_at)}</span>
              </div>
              
              <div className="flex items-center gap-2 pt-2 border-t border-border">
                <span className="text-muted-foreground">Amount Due:</span>
                <span className="font-bold text-lg text-primary">
                  {formatCurrency(order.price || 0, order.currency || "EUR")}
                </span>
              </div>
            </div>
          </div>

          {/* Custom Message */}
          <div className="space-y-2">
            <Label htmlFor="customMessage">Custom Message (Optional)</Label>
            <Textarea
              id="customMessage"
              placeholder="Add a personal message to include in the reminder email..."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              This message will be displayed in a highlighted section of the email.
            </p>
          </div>

          {/* Info */}
          <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 text-sm">
            <p className="text-blue-700 dark:text-blue-300">
              <strong>Note:</strong> This will send an email to the client ({order.contact_email || "no email"}) and a notification to the entire team (11 members).
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSending}>
            Cancel
          </Button>
          <Button onClick={handleSendReminder} disabled={isSending || !hasClientEmail}>
            {isSending ? (
              <>Sending...</>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Reminder
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SendClientReminderModal;
