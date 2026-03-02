import React, { useState } from "react";
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
import { InvoiceService } from "@/services/invoiceService";
import { Invoice, InvoiceLineItem, Client } from "@/types/invoice";

import { Mail, Send } from "lucide-react";
import { MonthlyContract, MonthlyInstallment } from "@/services/monthlyContractService";

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

interface SendMonthlyInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract: MonthlyContract;
  installment: MonthlyInstallment;
  detectedLanguage: string;
  invoice: Invoice | null;
  client: Client | null;
  onRefresh?: () => void;
}

const SendMonthlyInvoiceDialog: React.FC<SendMonthlyInvoiceDialogProps> = ({
  open, onOpenChange, contract, installment, detectedLanguage, invoice, client, onRefresh,
}) => {
  const { toast } = useToast();
  const [sending, setSending] = useState(false);
  const [clientEmail, setClientEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [language, setLanguage] = useState(detectedLanguage);

  React.useEffect(() => {
    if (open) {
      setClientEmail(contract.client_email);
      setSubject(`Invoice ${invoice?.invoice_number || ""} — ${installment.month_label}`);
      setMessage("");
      setLanguage(detectedLanguage);
    }
  }, [open, contract, installment, invoice, detectedLanguage]);

  const handleSend = async () => {
    if (!clientEmail) {
      toast({ title: "Error", description: "Client email is required.", variant: "destructive" });
      return;
    }

    setSending(true);
    try {
      // Auto-create client if missing
      let currentClient = client;
      if (!currentClient) {
        try {
          const clients = await InvoiceService.getClients();
          currentClient = clients.find(c => c.email.toLowerCase() === contract.client_email.toLowerCase()) || null;
          if (!currentClient) {
            currentClient = await InvoiceService.createClient({
              name: contract.client_name,
              email: contract.client_email,
              contact_person: contract.client_name,
              address: (contract as any).company_address || "",
              phone: (contract as any).contact_phone || "",
            });
            toast({ title: "Client auto-created", description: `Client "${contract.client_name}" was added to the invoice system.` });
          }
        } catch (err) {
          console.error("Failed to auto-create client:", err);
          toast({ title: "Error", description: "Failed to create client record.", variant: "destructive" });
          setSending(false);
          return;
        }
      }

      // Auto-create invoice if missing
      let currentInvoice = invoice;
      if (!currentInvoice) {
        try {
          const netPrice = Number((installment.amount / 1.19).toFixed(2));
          const vatAmount = Number((installment.amount - netPrice).toFixed(2));
          const description = contract.description
            ? `${contract.description} - ${installment.month_label}`
            : `Monthly Service - ${installment.month_label}`;

          currentInvoice = await InvoiceService.createInvoice({
            client_id: currentClient.id,
            issue_date: new Date().toISOString().split("T")[0],
            due_date: installment.due_date,
            currency: contract.currency || "EUR",
            payment_terms: "",
            notes: "",
            internal_notes: "",
            line_items: [{
              item_description: description,
              quantity: 1,
              unit: "pcs",
              unit_price: netPrice,
              vat_rate: 0.19,
              discount_rate: 0,
            }],
          });
          toast({ title: "Invoice auto-created", description: `Invoice ${currentInvoice.invoice_number} was generated.` });
        } catch (err) {
          console.error("Failed to auto-create invoice:", err);
          toast({ title: "Error", description: "Failed to create invoice.", variant: "destructive" });
          setSending(false);
          return;
        }
      }

      // Build line items for PDF
      const netPrice = Number((installment.amount / 1.19).toFixed(2));
      const description = contract.description
        ? `${contract.description} - ${installment.month_label}`
        : `Monthly Service - ${installment.month_label}`;

      const lineItems: InvoiceLineItem[] = [{
        id: "pdf-line",
        invoice_id: currentInvoice.id,
        item_description: description,
        quantity: 1,
        unit: "pcs",
        unit_price: netPrice,
        vat_rate: 0.19,
        discount_rate: 0,
        line_total: Number((netPrice * 1.19).toFixed(2)),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }];

      // Load saved template settings from localStorage
      let savedSettings: any = {};
      try {
        const raw = localStorage.getItem("invoiceTemplateSettings");
        if (raw) savedSettings = JSON.parse(raw);
      } catch {}

      const templateSettings = {
        ...savedSettings,
        currency: contract.currency || "EUR",
        language,
        selectedPaymentAccount: "both",
        vatEnabled: true,
        vatRate: 19,
      };

      const formData = {
        currency: contract.currency || "EUR",
        issue_date: new Date().toISOString().split("T")[0],
        due_date: installment.due_date,
      };

      const pdfBase64 = await generateInvoicePDFBase64({
        invoice: currentInvoice,
        lineItems,
        client: currentClient || undefined,
        templateSettings,
        formData,
      });

      // Send to client
      const { error } = await supabase.functions.invoke("send-invoice-pdf", {
        body: {
          client_email: clientEmail,
          subject,
          message,
          pdf_base64: pdfBase64,
          invoice_number: currentInvoice.invoice_number,
        },
      });

      if (error) throw error;

      // Update installment status in database
      await supabase
        .from('monthly_installments')
        .update({
          email_sent: true,
          email_sent_at: new Date().toISOString(),
          invoice_id: currentInvoice.id,
        })
        .eq('id', installment.id);

      toast({
        title: "Invoice sent",
        description: `Invoice sent to ${clientEmail} + team notified`,
      });
      onOpenChange(false);
      onRefresh?.();
    } catch (error) {
      console.error("Error sending invoice:", error);
      toast({ title: "Error", description: "Failed to send invoice.", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" onFocusOutside={e => e.preventDefault()} onPointerDownOutside={e => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Invoice — {installment.month_label}
          </DialogTitle>
          <DialogDescription>
            Send invoice PDF to the client. Team will be notified.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Client Name</Label>
            <Input value={contract.client_name} readOnly className="bg-muted" />
          </div>

          <div>
            <Label htmlFor="monthly-send-email">Client Email</Label>
            <Input
              id="monthly-send-email"
              type="email"
              value={clientEmail}
              onChange={e => setClientEmail(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="monthly-send-subject">Subject</Label>
            <Input
              id="monthly-send-subject"
              value={subject}
              onChange={e => setSubject(e.target.value)}
            />
          </div>

          <div>
            <Label>Invoice Language</Label>
            <Select value={language} onValueChange={setLanguage}>
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
            <Label htmlFor="monthly-send-message">Message</Label>
            <Textarea
              id="monthly-send-message"
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Write a message to accompany the invoice..."
              rows={4}
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

export default SendMonthlyInvoiceDialog;
