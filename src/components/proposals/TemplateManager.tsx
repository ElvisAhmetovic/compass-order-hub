import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Save, File, Loader2 } from "lucide-react";
import { proposalTemplateService, ProposalTemplate } from "@/services/proposalTemplateService";

interface TemplateManagerProps {
  currentProposalData: Record<string, unknown>;
  onLoadTemplate: (templateData: Record<string, unknown>) => void;
}

const TemplateManager: React.FC<TemplateManagerProps> = ({ 
  currentProposalData, 
  onLoadTemplate 
}) => {
  const [templateName, setTemplateName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoadDialogOpen, setIsLoadDialogOpen] = useState(false);
  const [templates, setTemplates] = useState<ProposalTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isLoadDialogOpen) {
      loadTemplates();
    }
  }, [isLoadDialogOpen]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await proposalTemplateService.getTemplates();
      setTemplates(data);
    } catch (error) {
      console.error("Error loading templates:", error);
      toast({
        title: "Error",
        description: "Failed to load templates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveAsTemplate = async () => {
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
      
      // Prepare template data - remove unique identifiers
      const templateData = {
        ...currentProposalData,
        id: undefined,
        number: undefined,
        created_at: undefined,
        updated_at: undefined,
      };

      await proposalTemplateService.createTemplate({
        name: templateName.trim(),
        template_data: templateData,
        is_default: false
      });

      toast({
        title: "Template saved",
        description: `"${templateName}" has been saved as a template.`,
      });

      setTemplateName("");
      setIsDialogOpen(false);
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

  const setAsDefault = async (templateId: string) => {
    try {
      await proposalTemplateService.setAsDefault(templateId);
      await loadTemplates();
      
      toast({
        title: "Default template set",
        description: "This template will now be used for new proposals.",
      });
    } catch (error) {
      console.error("Error setting default template:", error);
      toast({
        title: "Error",
        description: "Failed to set default template.",
        variant: "destructive",
      });
    }
  };

  const loadTemplate = (template: ProposalTemplate) => {
    onLoadTemplate(template.template_data);
    setIsLoadDialogOpen(false);
    toast({
      title: "Template loaded",
      description: `Template "${template.name}" has been applied to this proposal.`,
    });
  };

  const deleteTemplate = async (templateId: string) => {
    try {
      await proposalTemplateService.deleteTemplate(templateId);
      setTemplates(prev => prev.filter(t => t.id !== templateId));
      
      toast({
        title: "Template deleted",
        description: "Template has been removed.",
      });
    } catch (error) {
      console.error("Error deleting template:", error);
      toast({
        title: "Error",
        description: "Failed to delete template.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex gap-2">
      {/* Save as Template Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Save size={16} className="mr-2" />
            Save as Template
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Proposal as Template</DialogTitle>
            <DialogDescription>
              This will save all current content, settings, and line items as a reusable template.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="templateName">Template Name</Label>
              <Input
                id="templateName"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g., Standard Service Proposal"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveAsTemplate} disabled={saving}>
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

      {/* Load Template Dialog */}
      <Dialog open={isLoadDialogOpen} onOpenChange={setIsLoadDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <File size={16} className="mr-2" />
            Load Template
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Load Template</DialogTitle>
            <DialogDescription>
              Select a template to apply to this proposal. This will replace all current content.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : templates.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No templates saved yet. Save your first template using the "Save as Template" button.
              </p>
            ) : (
              templates.map((template) => (
                <div key={template.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium">{template.name}</h3>
                      {template.is_default && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded mt-1 inline-block">
                          Default Template
                        </span>
                      )}
                      <p className="text-sm text-muted-foreground mt-1">
                        Created: {new Date(template.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAsDefault(template.id)}
                        disabled={template.is_default}
                      >
                        Set as Default
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => loadTemplate(template)}
                      >
                        Load
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteTemplate(template.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TemplateManager;
