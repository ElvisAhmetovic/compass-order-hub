import React, { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { generateInvoicePDFBase64 } from "@/utils/invoicePdfGenerator";
import { supabase } from "@/integrations/supabase/client";
import { Invoice, InvoiceLineItem, Client } from "@/types/invoice";
import { Mail, Send } from "lucide-react";
import { SUBJECT_TEMPLATES, MESSAGE_TEMPLATES, TEMPLATE_LANGUAGES } from "@/components/monthly/monthlyInvoiceTemplates";

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "de", label: "Deutsch" },
  { value: "nl", label: "Nederlands" },
  { value: "fr", label: "Français" },
  { value: "es", label: "Español" },
  { value: "da", label: "Dansk" },
  { value: "no", label: "Norsk" },
  { value: "cs", label: "Čeština" },
  { value: "pl", label: "Polski" },
  { value: "sv", label: "Svenska" },
];

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
  open, onOpenChange, invoice, lineItems, client, templateSettings, formData,
}) => {
  const { toast } = useToast();
  const [sending, setSending] = useState(false);
  const [clientEmail, setClientEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [language, setLanguage] = useState("en");

  useEffect(() => {
    if (open) {
      const lang = templateSettings?.language || "en";
      setClientEmail(client?.email || "");
      setSubject(SUBJECT_TEMPLATES[lang] || SUBJECT_TEMPLATES["en"]);
      setMessage(MESSAGE_TEMPLATES[lang] || MESSAGE_TEMPLATES["en"]);
      setLanguage(lang);
    }
  }, [open, client, invoice, templateSettings]);

  const handleSend = async () => {
    if (!clientEmail) {
      toast({ title: "Error", description: "Client email is required.", variant: "destructive" });
      return;
    }

    setSending(true);
    try {
      const pdfBase64 = await generateInvoicePDFBase64({
        invoice, lineItems, client, templateSettings, formData,
      });

      // Fire-and-forget: send email in background
      supabase.functions.invoke("send-invoice-pdf", {
        body: {
          client_email: clientEmail,
          subject,
          message,
          pdf_base64: pdfBase64,
          invoice_number: invoice?.invoice_number || "new",
        },
      }).catch(err => console.error("Background invoice email error:", err));

      // Schedule payment reminder and mark as sent if invoice exists in DB
      if (invoice?.id) {
        try {
          const { data: currentInvoice } = await supabase.from('invoices').select('next_reminder_at, status, order_id').eq('id', invoice.id).single();
          const updateData: any = {};
          if (!currentInvoice?.next_reminder_at) {
            updateData.next_reminder_at = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
          }
          if (currentInvoice?.status === 'draft') {
            updateData.status = 'sent';
          }
          if (Object.keys(updateData).length > 0) {
            await supabase.from('invoices').update(updateData).eq('id', invoice.id);
          }
          // Sync "Invoice Sent" status to linked order
          const orderId = currentInvoice?.order_id || invoice?.order_id;
          if (orderId) {
            const { OrderService } = await import("@/services/orderService");
            await OrderService.toggleOrderStatus(orderId, "Invoice Sent", true).catch(err =>
              console.error("Error syncing invoice sent status to order:", err)
            );
          }
        } catch (err) {
          console.error("Error scheduling reminder:", err);
        }
      }

      toast({ title: "Invoice sent", description: `Invoice has been sent to ${clientEmail}` });
      onOpenChange(false);
    } catch (error) {
      console.error("Error generating invoice PDF:", error);
      toast({ title: "Error", description: "Failed to prepare invoice. Please try again.", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" onFocusOutside={e => e.preventDefault()} onPointerDownOutside={e => e.preventDefault()}>
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
            <Label>Client Name</Label>
            <Input value={client?.name || ""} readOnly className="bg-muted" />
          </div>

          <div>
            <Label htmlFor="send-email">Client Email</Label>
            <Input
              id="send-email"
              type="email"
              value={clientEmail}
              onChange={e => setClientEmail(e.target.value)}
              disabled={sending}
            />
          </div>

          <div>
            <Label>Subject Template</Label>
            <Select onValueChange={(val) => setSubject(SUBJECT_TEMPLATES[val] || "")}>
              <SelectTrigger>
                <SelectValue placeholder="Select language template..." />
              </SelectTrigger>
              <SelectContent>
                {TEMPLATE_LANGUAGES.map(l => (
                  <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="send-subject">Subject</Label>
            <Input
              id="send-subject"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              disabled={sending}
            />
          </div>

          <div>
            <Label>Invoice Language</Label>
            <Select value={language} onValueChange={(lang) => {
              setLanguage(lang);
              setSubject(SUBJECT_TEMPLATES[lang] || "");
              setMessage(MESSAGE_TEMPLATES[lang] || "");
            }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map(l => (
                  <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Message Template</Label>
            <Select onValueChange={(val) => setMessage(MESSAGE_TEMPLATES[val] || "")}>
              <SelectTrigger>
                <SelectValue placeholder="Select language template..." />
              </SelectTrigger>
              <SelectContent>
                {TEMPLATE_LANGUAGES.map(l => (
                  <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="send-message">Message</Label>
            <Textarea
              id="send-message"
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Write a message to accompany the invoice..."
              rows={4}
              disabled={sending}
            />
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 text-sm">
            <p className="text-blue-700 dark:text-blue-300">
              <strong>Note:</strong> The invoice PDF ({invoice?.invoice_number}) will be attached automatically.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={sending || !clientEmail}>
            <Send className="h-4 w-4 mr-2" />
            {sending ? "Sending..." : "Send Invoice"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SendInvoicePDFDialog;
