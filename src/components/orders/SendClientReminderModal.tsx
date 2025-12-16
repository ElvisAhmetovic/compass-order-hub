import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Order } from "@/types";
import { formatCurrency } from "@/utils/currencyUtils";
import { formatDate } from "@/lib/utils";
import { Send, AlertCircle, Mail, Phone, Calendar, Building2, Eye, Globe } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import TemplateSelector from "@/components/email-templates/TemplateSelector";
import { EmailTemplate, emailTemplateService } from "@/services/emailTemplateService";
import { emailTranslationService, SupportedLanguage, SUPPORTED_LANGUAGES } from "@/services/emailTranslationService";

interface SendClientReminderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order;
  onEmailSent?: () => void;
}

const SendClientReminderModal = ({ open, onOpenChange, order, onEmailSent }: SendClientReminderModalProps) => {
  const [customMessage, setCustomMessage] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>("en");
  const [previewMode, setPreviewMode] = useState<"info" | "preview">("info");
  const [isSending, setIsSending] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string } | null>(null);
  const { toast } = useToast();

  const hasClientEmail = !!order.contact_email && order.contact_email.trim() !== "";

  // Get current user info
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name, last_name")
          .eq("id", user.id)
          .single();
        
        const name = profile 
          ? `${profile.first_name} ${profile.last_name}`.trim() || user.email || "Unknown"
          : user.email || "Unknown";
        
        setCurrentUser({ id: user.id, name });
      }
    };
    fetchUser();
  }, []);

  // Update subject and body when template or language changes
  useEffect(() => {
    if (selectedTemplate) {
      const formattedPrice = formatCurrency(order.price || 0, order.currency || "EUR");
      
      // Check if this template has translations available
      if (emailTranslationService.hasTranslations(selectedTemplate.name)) {
        const translated = emailTranslationService.getTranslatedTemplate(
          selectedTemplate.name,
          selectedLanguage
        );
        
        if (translated) {
          // Use translated subject
          const translatedSubject = emailTemplateService.replaceVariables(translated.subject, {
            companyName: order.company_name,
            amount: formattedPrice,
          });
          setEmailSubject(translatedSubject);
          setEmailBody(translated.body);
          return;
        }
      }
      
      // Fallback to original template
      const subject = emailTemplateService.replaceVariables(selectedTemplate.subject, {
        companyName: order.company_name,
        amount: formattedPrice,
      });
      setEmailSubject(subject);
      setEmailBody(selectedTemplate.body);
    }
  }, [selectedTemplate, selectedLanguage, order]);

  const getTemplateVariables = () => {
    const formattedPrice = formatCurrency(order.price || 0, order.currency || "EUR");
    const formattedDate = formatDate(order.created_at);
    
    return {
      companyName: order.company_name,
      clientEmail: order.contact_email || "",
      contactPhone: order.contact_phone || "",
      website: order.company_link || "",
      orderDate: formattedDate,
      orderDescription: order.description || "",
      amount: formattedPrice,
      customMessage: customMessage.trim() || undefined,
      teamMemberName: currentUser?.name || "Team Member",
    };
  };

  const getPreviewHtml = () => {
    if (!emailBody) return "";
    return emailTemplateService.replaceVariables(emailBody, getTemplateVariables());
  };

  const handleSendReminder = async () => {
    if (!hasClientEmail) {
      toast({
        title: "No Client Email",
        description: "This order doesn't have a client email address. Please add one first.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedTemplate) {
      toast({
        title: "No Template Selected",
        description: "Please select an email template.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);

    try {
      const variables = getTemplateVariables();
      const finalEmailBody = emailTemplateService.replaceVariables(emailBody, variables);

      const { data, error } = await supabase.functions.invoke("send-client-payment-reminder", {
        body: {
          clientEmail: order.contact_email,
          companyName: order.company_name,
          contactPhone: order.contact_phone,
          companyLink: order.company_link || null,
          orderCreatedAt: order.created_at,
          orderDescription: order.description,
          orderPrice: order.price,
          orderCurrency: order.currency || "EUR",
          customMessage: customMessage.trim() || null,
          orderId: order.id,
          sentByName: currentUser?.name || "Team Member",
          sentById: currentUser?.id || null,
          // Custom template data
          emailSubject: emailSubject,
          emailBodyHtml: finalEmailBody,
          templateId: selectedTemplate.id,
          templateName: selectedTemplate.name,
          language: selectedLanguage,
        },
      });

      if (error) {
        throw error;
      }

      const languageLabel = SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage)?.label || selectedLanguage;
      toast({
        title: "Reminder Sent Successfully",
        description: `Payment reminder (${languageLabel}) sent to ${order.contact_email} and team notified.`,
      });

      setCustomMessage("");
      onOpenChange(false);
      onEmailSent?.();
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

  const hasTranslations = selectedTemplate ? emailTranslationService.hasTranslations(selectedTemplate.name) : false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            Send Payment Reminder to Client
          </DialogTitle>
          <DialogDescription>
            Select a template, language, and customize your payment reminder email.
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

          {/* Template and Language Selection Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Template Selector */}
            <TemplateSelector
              type="payment_reminder"
              selectedTemplateId={selectedTemplate?.id || null}
              onTemplateSelect={setSelectedTemplate}
              disabled={isSending}
            />

            {/* Language Selector */}
            <div className="space-y-2">
              <Label htmlFor="language">Email Language</Label>
              <Select
                value={selectedLanguage}
                onValueChange={(value) => setSelectedLanguage(value as SupportedLanguage)}
                disabled={isSending}
              >
                <SelectTrigger id="language">
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

          {/* Email Subject */}
          {selectedTemplate && (
            <div className="space-y-2">
              <Label htmlFor="subject">Email Subject</Label>
              <Input
                id="subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Email subject..."
              />
            </div>
          )}

          <Separator />

          {/* Tab view for Order Details / Email Preview */}
          <Tabs value={previewMode} onValueChange={(v) => setPreviewMode(v as "info" | "preview")}>
            <TabsList className="w-full">
              <TabsTrigger value="info" className="flex-1">
                <Building2 className="h-4 w-4 mr-2" />
                Order Details
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex-1" disabled={!selectedTemplate}>
                <Eye className="h-4 w-4 mr-2" />
                Email Preview
              </TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="mt-4">
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

                  {order.company_link && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Website:</span>
                      <a href={order.company_link} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline truncate max-w-[300px]">
                        {order.company_link}
                      </a>
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
            </TabsContent>

            <TabsContent value="preview" className="mt-4">
              {selectedTemplate && (
                <div className="border rounded-lg p-4 bg-white dark:bg-gray-900 max-h-[300px] overflow-y-auto">
                  <div className="mb-2 pb-2 border-b">
                    <p className="text-sm text-muted-foreground">Subject: <span className="font-medium text-foreground">{emailSubject}</span></p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Language: {SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage)?.flag} {SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage)?.label}
                    </p>
                  </div>
                  <div
                    className="prose prose-sm max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: getPreviewHtml() }}
                  />
                </div>
              )}
            </TabsContent>
          </Tabs>

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
          <Button onClick={handleSendReminder} disabled={isSending || !hasClientEmail || !selectedTemplate}>
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
