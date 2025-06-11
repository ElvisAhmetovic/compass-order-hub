
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { EmailService, EmailTemplate } from "@/services/emailService";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Mail } from "lucide-react";

const EmailTemplateManager: React.FC = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    body: "",
    type: "invoice" as const,
    isDefault: false
  });
  const { toast } = useToast();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await EmailService.getEmailTemplates();
      setTemplates(data);
    } catch (error) {
      console.error("Error loading templates:", error);
      toast({
        title: "Error",
        description: "Failed to load email templates.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (editingTemplate) {
        // Update existing template (this would need an update method in EmailService)
        toast({
          title: "Note",
          description: "Template update functionality needs to be implemented.",
        });
      } else {
        // Create new template
        await EmailService.createEmailTemplate(formData);
        toast({
          title: "Success",
          description: "Email template created successfully.",
        });
      }
      
      loadTemplates();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error saving template:", error);
      toast({
        title: "Error",
        description: "Failed to save email template.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      subject: "",
      body: "",
      type: "invoice",
      isDefault: false
    });
    setEditingTemplate(null);
  };

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      subject: template.subject,
      body: template.body,
      type: template.type,
      isDefault: template.isDefault || false
    });
    setIsDialogOpen(true);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'invoice':
        return 'default';
      case 'payment_reminder':
        return 'secondary';
      case 'order_status':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const defaultTemplates = {
    invoice: `Dear {client_name},

Please find attached your invoice {invoice_number}.

Invoice Details:
- Amount: {amount} {currency}
- Due Date: {due_date}

Thank you for your business!

Best regards,
AB Media Team`,
    payment_reminder: `Dear {client_name},

This is a friendly reminder that invoice {invoice_number} is due.

Invoice Details:
- Amount: {amount} {currency}
- Due Date: {due_date}
- Days Overdue: {days_overdue}

Please process payment at your earliest convenience.

Best regards,
AB Media Team`,
    order_status: `Dear {client_name},

Your order status has been updated.

Order: {order_id}
Status: {status}
Updated: {updated_date}

Thank you for choosing our services!

Best regards,
AB Media Team`
  };

  const handleTemplateTypeChange = (type: string) => {
    setFormData(prev => ({
      ...prev,
      type: type as any,
      body: prev.body || defaultTemplates[type as keyof typeof defaultTemplates] || ""
    }));
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Email Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading templates...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Templates
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-1" />
                New Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingTemplate ? "Edit Template" : "Create Template"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Template Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Standard Invoice"
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Template Type</Label>
                    <Select value={formData.type} onValueChange={handleTemplateTypeChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="invoice">Invoice</SelectItem>
                        <SelectItem value="payment_reminder">Payment Reminder</SelectItem>
                        <SelectItem value="order_status">Order Status</SelectItem>
                        <SelectItem value="general">General</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="subject">Subject Line</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="e.g., Invoice {invoice_number} from AB Media Team"
                  />
                </div>

                <div>
                  <Label htmlFor="body">Email Body</Label>
                  <Textarea
                    id="body"
                    value={formData.body}
                    onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
                    rows={12}
                    placeholder="Email content with variables like {client_name}, {invoice_number}, etc."
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isDefault"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData(prev => ({ ...prev, isDefault: e.target.checked }))}
                  />
                  <Label htmlFor="isDefault">Set as default template</Label>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>
                    {editingTemplate ? "Update" : "Create"} Template
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {templates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No email templates found. Create your first template to get started.
            </div>
          ) : (
            templates.map((template) => (
              <div key={template.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{template.name}</h3>
                    <Badge variant={getTypeColor(template.type)}>
                      {template.type}
                    </Badge>
                    {template.isDefault && (
                      <Badge variant="default">Default</Badge>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(template)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        // Delete functionality would go here
                        toast({
                          title: "Note",
                          description: "Delete functionality needs to be implemented.",
                        });
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  <strong>Subject:</strong> {template.subject}
                </p>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {template.body}
                </p>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EmailTemplateManager;
