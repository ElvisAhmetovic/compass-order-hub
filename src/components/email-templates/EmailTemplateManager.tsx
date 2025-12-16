import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { emailTemplateService, EmailTemplate, EmailTemplateInput } from "@/services/emailTemplateService";
import { Plus, Edit, Trash2, Copy, Star, FileText, Eye, Code } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TEMPLATE_TYPES = [
  { value: "payment_reminder", label: "Payment Reminder" },
  { value: "invoice", label: "Invoice" },
  { value: "order_status", label: "Order Status" },
  { value: "general", label: "General" },
];

const AVAILABLE_VARIABLES = [
  { name: "{companyName}", description: "Client's company name" },
  { name: "{clientEmail}", description: "Client's email address" },
  { name: "{contactPhone}", description: "Client's phone number" },
  { name: "{orderDate}", description: "Order creation date" },
  { name: "{orderDescription}", description: "Order description" },
  { name: "{amount}", description: "Formatted amount with currency" },
  { name: "{customMessage}", description: "Custom message from team member" },
  { name: "{teamMemberName}", description: "Name of team member sending" },
];

const EmailTemplateManager = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<EmailTemplate | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [previewMode, setPreviewMode] = useState<"edit" | "preview">("edit");
  const [formData, setFormData] = useState<EmailTemplateInput>({
    name: "",
    subject: "",
    body: "",
    type: "payment_reminder",
    is_default: false,
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const data = await emailTemplateService.getTemplates();
      setTemplates(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load email templates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingTemplate(null);
    setFormData({
      name: "",
      subject: "",
      body: "",
      type: "payment_reminder",
      is_default: false,
    });
    setPreviewMode("edit");
    setDialogOpen(true);
  };

  const handleOpenEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      subject: template.subject,
      body: template.body,
      type: template.type,
      is_default: template.is_default,
    });
    setPreviewMode("edit");
    setDialogOpen(true);
  };

  const handleDuplicate = async (template: EmailTemplate) => {
    try {
      await emailTemplateService.duplicateTemplate(template.id, `${template.name} (Copy)`);
      toast({ title: "Template duplicated successfully" });
      loadTemplates();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to duplicate template",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!templateToDelete) return;
    try {
      await emailTemplateService.deleteTemplate(templateToDelete.id);
      toast({ title: "Template deleted successfully" });
      loadTemplates();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.subject || !formData.body) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      if (editingTemplate) {
        await emailTemplateService.updateTemplate(editingTemplate.id, formData);
        toast({ title: "Template updated successfully" });
      } else {
        await emailTemplateService.createTemplate(formData);
        toast({ title: "Template created successfully" });
      }
      setDialogOpen(false);
      loadTemplates();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save template",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const insertVariable = (variable: string) => {
    setFormData((prev) => ({
      ...prev,
      body: prev.body + variable,
    }));
  };

  const getPreviewHtml = () => {
    return emailTemplateService.replaceVariables(formData.body, {
      companyName: "Example Company GmbH",
      clientEmail: "client@example.com",
      contactPhone: "+49 123 456789",
      orderDate: "15. Dezember 2024",
      orderDescription: "Premium Service Package",
      amount: "€1.299,00",
      customMessage: "Please complete payment by Friday.",
      teamMemberName: "Thomas Klein",
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Email Templates</h2>
          <p className="text-muted-foreground">
            Create and manage reusable email templates for client communications
          </p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>

      {/* Template List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <Card key={template.id} className="relative">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    {template.name}
                    {template.is_default && (
                      <Badge variant="secondary" className="text-xs">
                        <Star className="h-3 w-3 mr-1 fill-current" />
                        Default
                      </Badge>
                    )}
                  </CardTitle>
                  <Badge variant="outline" className="text-xs">
                    {TEMPLATE_TYPES.find((t) => t.value === template.type)?.label || template.type}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="line-clamp-2 mb-4">
                {template.subject}
              </CardDescription>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleOpenEdit(template)}>
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDuplicate(template)}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setTemplateToDelete(template);
                    setDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {templates.length === 0 && (
        <Card className="p-8 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No templates yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first email template to get started
          </p>
          <Button onClick={handleOpenCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? "Edit Template" : "Create New Template"}
            </DialogTitle>
            <DialogDescription>
              {editingTemplate
                ? "Modify your email template"
                : "Create a new reusable email template"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Template Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Friendly Reminder"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Template Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPLATE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Email Subject *</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="e.g., Payment Reminder - {companyName} - {amount}"
              />
              <p className="text-xs text-muted-foreground">
                You can use variables like {"{companyName}"} and {"{amount}"}
              </p>
            </div>

            {/* Variable Buttons */}
            <div className="space-y-2">
              <Label>Insert Variables</Label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_VARIABLES.map((v) => (
                  <Button
                    key={v.name}
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => insertVariable(v.name)}
                    title={v.description}
                  >
                    {v.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Body Editor with Preview Toggle */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Email Body (HTML) *</Label>
                <Tabs value={previewMode} onValueChange={(v) => setPreviewMode(v as "edit" | "preview")}>
                  <TabsList className="h-8">
                    <TabsTrigger value="edit" className="text-xs px-3">
                      <Code className="h-3 w-3 mr-1" />
                      Edit
                    </TabsTrigger>
                    <TabsTrigger value="preview" className="text-xs px-3">
                      <Eye className="h-3 w-3 mr-1" />
                      Preview
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {previewMode === "edit" ? (
                <Textarea
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  placeholder="Enter your email body HTML..."
                  className="font-mono text-sm min-h-[300px]"
                />
              ) : (
                <div className="border rounded-lg p-4 min-h-[300px] bg-white">
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: getPreviewHtml() }}
                  />
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_default"
                checked={formData.is_default}
                onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
              />
              <Label htmlFor="is_default">Set as default template for this type</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : editingTemplate ? "Update Template" : "Create Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{templateToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EmailTemplateManager;
