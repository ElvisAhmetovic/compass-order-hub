
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { EmailService, EmailTemplate } from "@/services/emailService";
import { PaymentService } from "@/services/paymentService";
import { Invoice } from "@/types/invoice";
import { Mail, CreditCard, Copy, ExternalLink } from "lucide-react";

interface SendInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice | null;
}

const SendInvoiceDialog: React.FC<SendInvoiceDialogProps> = ({
  open,
  onOpenChange,
  invoice
}) => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [paymentLinks, setPaymentLinks] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && invoice) {
      loadTemplates();
      loadPaymentLinks();
      setEmailSubject(`Invoice ${invoice.invoice_number} from AB Media Team`);
      setEmailBody(`Dear ${invoice.client?.name || 'Valued Customer'},

Please find attached your invoice ${invoice.invoice_number}.

Amount Due: ${invoice.total_amount} ${invoice.currency}
Due Date: ${new Date(invoice.due_date).toLocaleDateString()}

Thank you for your business!

Best regards,
AB Media Team`);
    }
  }, [open, invoice]);

  const loadTemplates = async () => {
    try {
      const data = await EmailService.getEmailTemplates();
      const invoiceTemplates = data.filter(t => t.type === 'invoice');
      setTemplates(invoiceTemplates);
      
      const defaultTemplate = invoiceTemplates.find(t => t.isDefault);
      if (defaultTemplate) {
        setSelectedTemplateId(defaultTemplate.id);
        setEmailSubject(defaultTemplate.subject);
        setEmailBody(defaultTemplate.body);
      }
    } catch (error) {
      console.error("Error loading templates:", error);
    }
  };

  const loadPaymentLinks = async () => {
    if (!invoice) return;
    
    try {
      const links = await PaymentService.getPaymentLinks(invoice.id);
      setPaymentLinks(links);
    } catch (error) {
      console.error("Error loading payment links:", error);
    }
  };

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setEmailSubject(template.subject);
      setEmailBody(template.body);
    }
  };

  const handleSendEmail = async () => {
    if (!invoice?.client?.email) {
      toast({
        title: "Error",
        description: "Client email is required to send invoice.",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      await EmailService.sendInvoiceEmail(
        invoice.id,
        invoice.client.email,
        customMessage
      );

      toast({
        title: "Invoice sent",
        description: `Invoice has been sent to ${invoice.client.email}`,
      });

      onOpenChange(false);
    } catch (error) {
      console.error("Error sending invoice:", error);
      toast({
        title: "Error",
        description: "Failed to send invoice. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleCreatePaymentLink = async (method: string = 'stripe') => {
    if (!invoice) return;

    setCreating(true);
    try {
      const paymentLink = await PaymentService.createPaymentLink(invoice.id, method);
      
      toast({
        title: "Payment link created",
        description: "Payment link has been generated successfully.",
      });

      setPaymentLinks([paymentLink, ...paymentLinks]);
    } catch (error) {
      console.error("Error creating payment link:", error);
      toast({
        title: "Error",
        description: "Failed to create payment link. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Payment link copied to clipboard.",
    });
  };

  if (!invoice) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Invoice {invoice.invoice_number}
          </DialogTitle>
          <DialogDescription>
            Send invoice to client and create payment links
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="email" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email">Email Invoice</TabsTrigger>
            <TabsTrigger value="payment">Payment Links</TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="template">Email Template</Label>
                <Select value={selectedTemplateId} onValueChange={handleTemplateChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="clientEmail">To</Label>
                <Input
                  id="clientEmail"
                  value={invoice.client?.email || ""}
                  disabled
                />
              </div>
            </div>

            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                rows={8}
              />
            </div>

            <div>
              <Label htmlFor="customMessage">Additional Message (Optional)</Label>
              <Textarea
                id="customMessage"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Add any custom message for this specific invoice..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSendEmail} disabled={sending}>
                {sending ? "Sending..." : "Send Invoice"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="payment" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Payment Links</h3>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleCreatePaymentLink('stripe')}
                  disabled={creating}
                  size="sm"
                >
                  <CreditCard className="h-4 w-4 mr-1" />
                  {creating ? "Creating..." : "Create Stripe Link"}
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {paymentLinks.map((link) => (
                <Card key={link.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        {link.payment_method.toUpperCase()} Payment
                      </CardTitle>
                      <Badge variant={
                        link.status === 'paid' ? 'default' :
                        link.status === 'active' ? 'secondary' :
                        'destructive'
                      }>
                        {link.status.toUpperCase()}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <code className="text-sm bg-muted px-2 py-1 rounded flex-1">
                          {link.payment_url}
                        </code>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(link.payment_url)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(link.payment_url, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Amount: {link.amount} {link.currency} | 
                        Created: {new Date(link.created_at).toLocaleDateString()} |
                        Expires: {new Date(link.expires_at).toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {paymentLinks.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No payment links created yet. Create one to enable online payments.
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default SendInvoiceDialog;
