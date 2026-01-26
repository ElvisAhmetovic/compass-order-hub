
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter 
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { emailTemplateService, EmailTemplate } from "@/services/emailTemplateService";
import { useToast } from "@/hooks/use-toast";
import { Eye, Save, Plus, Loader2 } from "lucide-react";

interface EmailTemplateVariables {
  clientName: string;
  invoiceNumber: string;
  amount: string;
  dueDate: string;
  daysOverdue: number;
  companyName: string;
  paymentInstructions: string;
}

interface EmailTemplateEditorProps {
  invoiceData: {
    clientName: string;
    invoiceNumber: string;
    amount: string;
    dueDate: string;
    daysOverdue: number;
  };
  onSendEmail: (subject: string, body: string) => Promise<void>;
  onCancel: () => void;
}

const replaceTemplateVariables = (template: string, variables: EmailTemplateVariables): string => {
  return template
    .replace(/\{clientName\}/g, variables.clientName)
    .replace(/\{invoiceNumber\}/g, variables.invoiceNumber)
    .replace(/\{amount\}/g, variables.amount)
    .replace(/\{dueDate\}/g, variables.dueDate)
    .replace(/\{daysOverdue\}/g, variables.daysOverdue.toString())
    .replace(/\{companyName\}/g, variables.companyName)
    .replace(/\{paymentInstructions\}/g, variables.paymentInstructions);
};

const EmailTemplateEditor: React.FC<EmailTemplateEditorProps> = ({
  invoiceData,
  onSendEmail,
  onCancel
}) => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const templateVariables: EmailTemplateVariables = {
    clientName: invoiceData.clientName,
    invoiceNumber: invoiceData.invoiceNumber,
    amount: invoiceData.amount,
    dueDate: invoiceData.dueDate,
    daysOverdue: invoiceData.daysOverdue,
    companyName: "AB Media Team",
    paymentInstructions: "Please transfer the amount to our bank account or contact us for alternative payment methods."
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await emailTemplateService.getTemplates("payment_reminder");
      setTemplates(data);
      
      // Load default template or first available
      const defaultTemplate = data.find(t => t.is_default) || data[0];
      if (defaultTemplate) {
        setSelectedTemplate(defaultTemplate);
        setSubject(defaultTemplate.subject);
        setBody(defaultTemplate.body);
      }
    } catch (error) {
      console.error("Error loading templates:", error);
      toast({
        title: "Error",
        description: "Failed to load email templates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(template);
      setSubject(template.subject);
      setBody(template.body);
    }
  };

  const insertVariable = (variable: keyof EmailTemplateVariables) => {
    const variableText = `{${variable}}`;
    setBody(prev => prev + variableText);
  };

  const getPreviewContent = () => {
    return {
      subject: replaceTemplateVariables(subject, templateVariables),
      body: replaceTemplateVariables(body, templateVariables)
    };
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      toast({
        title: "Template name required",
        description: "Please enter a name for your template.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      const newTemplate = await emailTemplateService.createTemplate({
        name: templateName.trim(),
        subject,
        body,
        type: "payment_reminder",
        is_default: isDefault
      });

      setTemplates(prev => [...prev, newTemplate]);
      setTemplateName("");
      setIsDefault(false);
      setSaveDialogOpen(false);

      toast({
        title: "Template saved",
        description: `"${templateName}" has been saved successfully.`,
      });
    } catch (error) {
      console.error("Error saving template:", error);
      toast({
        title: "Error",
        description: "Failed to save template.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSendEmail = async () => {
    if (!subject.trim() || !body.trim()) {
      toast({
        title: "Email content required",
        description: "Please enter both subject and email body.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSending(true);
      const preview = getPreviewContent();
      await onSendEmail(preview.subject, preview.body);
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setSending(false);
    }
  };

  const variableButtons = [
    { key: 'clientName' as const, label: 'Client Name' },
    { key: 'invoiceNumber' as const, label: 'Invoice #' },
    { key: 'amount' as const, label: 'Amount' },
    { key: 'dueDate' as const, label: 'Due Date' },
    { key: 'daysOverdue' as const, label: 'Days Overdue' },
    { key: 'companyName' as const, label: 'Company Name' },
  ];

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Email Template Editor</span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              <Eye size={16} className="mr-1" />
              {showPreview ? 'Hide' : 'Show'} Preview
            </Button>
            <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Save size={16} className="mr-1" />
                  Save Template
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Save Email Template</DialogTitle>
                  <DialogDescription>
                    Save this email template for future use.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="templateName">Template Name</Label>
                    <Input
                      id="templateName"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      placeholder="e.g., Polite Reminder, Urgent Notice"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isDefault"
                      checked={isDefault}
                      onChange={(e) => setIsDefault(e.target.checked)}
                    />
                    <Label htmlFor="isDefault">Set as default template</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveTemplate} disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Template"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Template Selection */}
        <div className="space-y-2">
          <Label>Select Template</Label>
          <Select
            value={selectedTemplate?.id || ""}
            onValueChange={handleTemplateSelect}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose a template" />
            </SelectTrigger>
            <SelectContent>
              {templates.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  <div className="flex items-center gap-2">
                    {template.name}
                    {template.is_default && <Badge variant="secondary" className="text-xs">Default</Badge>}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Template Variables */}
        <div className="space-y-2">
          <Label>Insert Variables</Label>
          <div className="flex flex-wrap gap-2">
            {variableButtons.map((variable) => (
              <Button
                key={variable.key}
                variant="outline"
                size="sm"
                onClick={() => insertVariable(variable.key)}
              >
                <Plus size={14} className="mr-1" />
                {variable.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {/* Subject Line */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject Line</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter email subject..."
            />
          </div>

          {/* Email Body */}
          <div className="space-y-2">
            <Label htmlFor="body">Email Body</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Enter email content..."
              rows={8}
            />
          </div>
        </div>

        {/* Preview */}
        {showPreview && (
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-sm">Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <strong>Subject:</strong> {getPreviewContent().subject}
              </div>
              <div>
                <strong>Body:</strong>
                <div className="whitespace-pre-wrap text-sm mt-1 p-2 bg-background rounded border">
                  {getPreviewContent().body}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSendEmail} disabled={sending}>
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              "Send Email"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmailTemplateEditor;
