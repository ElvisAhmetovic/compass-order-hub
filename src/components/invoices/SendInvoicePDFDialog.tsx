import React, { useState, useEffect } from "react";
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
import { Mail, Send, Eye, FileText } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import TemplateSelector from "@/components/email-templates/TemplateSelector";
import { EmailTemplate, emailTemplateService } from "@/services/emailTemplateService";
import { emailTranslationService, SupportedLanguage, SUPPORTED_LANGUAGES } from "@/services/emailTranslationService";
import { sanitizeHtml } from "@/utils/sanitize";

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
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>("en");
  const [emailBody, setEmailBody] = useState("");
  const [previewMode, setPreviewMode] = useState<"compose" | "preview">("compose");

  useEffect(() => {
    if (open) {
      setClientEmail(client?.email || "");
      setSubject(`Invoice ${invoice?.invoice_number || "new"} from AB Media Team`);
      setMessage("");
      setSelectedTemplate(null);
      setEmailBody("");
      setPreviewMode("compose");
    }
  }, [open, client, invoice]);

  // Update subject and body when template or language changes
  useEffect(() => {
    if (selectedTemplate) {
      const variables = {
        companyName: client?.name || "",
        amount: `${invoice?.currency || "EUR"} ${invoice?.total_amount?.toFixed(2) || "0.00"}`,
      };

      if (emailTranslationService.hasTranslations(selectedTemplate.name)) {
        const translated = emailTranslationService.getTranslatedTemplate(
          selectedTemplate.name,
          selectedLanguage
        );
        if (translated) {
          setSubject(emailTemplateService.replaceVariables(translated.subject, variables));
          setEmailBody(translated.body);
          return;
        }
      }

      setSubject(emailTemplateService.replaceVariables(selectedTemplate.subject, variables));
      setEmailBody(selectedTemplate.body);
    }
  }, [selectedTemplate, selectedLanguage, client, invoice]);

  const getTemplateVariables = () => ({
    companyName: client?.name || "",
    clientEmail: client?.email || "",
    contactPhone: client?.phone || "",
    orderDescription: `Invoice ${invoice?.invoice_number || ""}`,
    amount: `${invoice?.currency || "EUR"} ${invoice?.total_amount?.toFixed(2) || "0.00"}`,
    customMessage: message.trim() || undefined,
    teamMemberName: "AB Media Team",
  });

  const getPreviewHtml = () => {
    if (!emailBody) return "";
    return emailTemplateService.replaceVariables(emailBody, getTemplateVariables());
  };

  const hasTranslations = selectedTemplate
    ? emailTranslationService.hasTranslations(selectedTemplate.name)
    : false;

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

      // If a template is selected, use the rendered body as the message
      let finalMessage = message;
      if (selectedTemplate && emailBody) {
        finalMessage = emailTemplateService.replaceVariables(emailBody, getTemplateVariables());
      }

      const { data, error } = await supabase.functions.invoke("send-invoice-pdf", {
        body: {
          client_email: clientEmail,
          subject,
          message: finalMessage,
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
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto" onFocusOutside={(e) => e.preventDefault()} onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Invoice to Client
          </DialogTitle>
          <DialogDescription>
            The invoice PDF will be attached to this email. Select a template or write a custom message.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Client Email */}
          <div>
            <Label htmlFor="send-email">Client Email</Label>
            <Input
              id="send-email"
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              placeholder="client@example.com"
              disabled={sending}
            />
          </div>

          {/* Template and Language Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TemplateSelector
              type="invoice"
              selectedTemplateId={selectedTemplate?.id || null}
              onTemplateSelect={setSelectedTemplate}
              disabled={sending}
            />

            <div className="space-y-2">
              <Label htmlFor="invoice-language">Email Language</Label>
              <Select
                value={selectedLanguage}
                onValueChange={(value) => setSelectedLanguage(value as SupportedLanguage)}
                disabled={sending}
              >
                <SelectTrigger id="invoice-language">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      <span className="flex items-center gap-2">
                        <span>{lang.flag}</span>
                        <span>{lang.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTemplate && !hasTranslations && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Custom templates use original content (no translation)
                </p>
              )}
            </div>
          </div>

          {/* Subject */}
          <div>
            <Label htmlFor="send-subject">Subject</Label>
            <Input
              id="send-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={sending}
            />
          </div>

          <Separator />

          {/* Tabs: Compose / Preview */}
          <Tabs value={previewMode} onValueChange={(v) => setPreviewMode(v as "compose" | "preview")}>
            <TabsList className="w-full">
              <TabsTrigger value="compose" className="flex-1">
                <FileText className="h-4 w-4 mr-2" />
                Message
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex-1" disabled={!selectedTemplate || !emailBody}>
                <Eye className="h-4 w-4 mr-2" />
                Email Preview
              </TabsTrigger>
            </TabsList>

            <TabsContent value="compose" className="mt-4">
              <div className="space-y-2">
                <Label htmlFor="send-message">
                  {selectedTemplate ? "Custom Message (Optional)" : "Message"}
                </Label>
                <Textarea
                  id="send-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={
                    selectedTemplate
                      ? "Add a personal note to include in the email..."
                      : "Write a message to accompany the invoice..."
                  }
                  rows={5}
                  disabled={sending}
                />
                {selectedTemplate && (
                  <p className="text-xs text-muted-foreground">
                    This message will be included in the template's custom message section.
                  </p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="preview" className="mt-4">
              {selectedTemplate && emailBody && (
                <div className="border rounded-lg p-4 bg-white dark:bg-gray-900 max-h-[300px] overflow-y-auto">
                  <div className="mb-2 pb-2 border-b">
                    <p className="text-sm text-muted-foreground">
                      Subject: <span className="font-medium text-foreground">{subject}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Language: {SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguage)?.flag}{" "}
                      {SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguage)?.label}
                    </p>
                  </div>
                  <div
                    className="prose prose-sm max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(getPreviewHtml()) }}
                  />
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Info note */}
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
