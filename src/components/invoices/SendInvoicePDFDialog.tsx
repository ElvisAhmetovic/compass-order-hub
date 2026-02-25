import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { generateInvoicePDFBase64 } from "@/utils/invoicePdfGenerator";
import { supabase } from "@/integrations/supabase/client";
import { Invoice, InvoiceLineItem, Client } from "@/types/invoice";
import { Mail, Send } from "lucide-react";

interface SendInvoicePDFDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice | null;
  lineItems: InvoiceLineItem[];
  client?: Client;
  templateSettings: any;
  formData?: any;
}

const SendInvoicePDFDialog: React.FC<SendInvoicePDFDialogProps> = ({
  open,
  onOpenChange,
  invoice,
  lineItems,
  client,
  templateSettings,
  formData,
}) => {
  const { toast } = useToast();
  const [sending, setSending] = useState(false);
  const [clientEmail, setClientEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  React.useEffect(() => {
    if (open) {
      setClientEmail(client?.email || "");
      setSubject(`Invoice ${invoice?.invoice_number || "new"} from AB Media Team`);
      setMessage("");
    }
  }, [open, client, invoice]);

  const handleSend = async () => {
    if (!clientEmail) {
      toast({ title: "Error", description: "Client email is required.", variant: "destructive" });
      return;
    }

    setSending(true);
    try {
      const pdfBase64 = await generateInvoicePDFBase64({
        invoice,
        lineItems,
        client,
        templateSettings,
        formData,
      });

      const { data, error } = await supabase.functions.invoke("send-invoice-pdf", {
        body: {
          client_email: clientEmail,
          subject,
          message,
          pdf_base64: pdfBase64,
          invoice_number: invoice?.invoice_number || "new",
        },
      });

      if (error) throw error;

      toast({
        title: "Invoice sent",
        description: `Invoice has been sent to ${clientEmail}`,
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Error sending invoice PDF:", error);
      toast({
        title: "Error",
        description: "Failed to send invoice. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Invoice to Client
          </DialogTitle>
          <DialogDescription>
            The invoice PDF will be attached to this email.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="send-email">Client Email</Label>
            <Input
              id="send-email"
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              placeholder="client@example.com"
            />
          </div>

          <div>
            <Label htmlFor="send-subject">Subject</Label>
            <Input
              id="send-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="send-message">Message</Label>
            <Textarea
              id="send-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write a message to accompany the invoice..."
              rows={5}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={sending}>
            <Send className="h-4 w-4 mr-2" />
            {sending ? "Sending..." : "Send Invoice"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SendInvoicePDFDialog;
