import React, { useState } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { Save, FileTemplate, RotateCcw } from "lucide-react";

interface ProposalTemplate {
  id: string;
  name: string;
  isDefault: boolean;
  templateData: any;
  createdAt: string;
}

interface TemplateManagerProps {
  currentProposalData: any;
  onLoadTemplate: (templateData: any) => void;
}

const TemplateManager: React.FC<TemplateManagerProps> = ({ 
  currentProposalData, 
  onLoadTemplate 
}) => {
  const [templateName, setTemplateName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoadDialogOpen, setIsLoadDialogOpen] = useState(false);
  const [templates, setTemplates] = useState<ProposalTemplate[]>([]);
  const { toast } = useToast();

  React.useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = () => {
    try {
      const savedTemplates = localStorage.getItem("proposalTemplates");
      if (savedTemplates) {
        setTemplates(JSON.parse(savedTemplates));
      }
    } catch (error) {
      console.error("Error loading templates:", error);
    }
  };

  const saveAsTemplate = () => {
    if (!templateName.trim()) {
      toast({
        title: "Template name required",
        description: "Please enter a name for your template.",
        variant: "destructive",
      });
      return;
    }

    try {
      const newTemplate: ProposalTemplate = {
        id: `template_${Date.now()}`,
        name: templateName.trim(),
        isDefault: false,
        templateData: {
          ...currentProposalData,
          // Remove unique identifiers that shouldn't be copied
          id: undefined,
          number: undefined,
          created_at: undefined,
          updated_at: undefined,
          // Keep all the content and settings
          customerName: currentProposalData.customerName,
          customerAddress: currentProposalData.customerAddress,
          customerEmail: currentProposalData.customerEmail,
          customerCountry: currentProposalData.customerCountry,
          proposalTitle: currentProposalData.proposalTitle,
          proposalDescription: currentProposalData.proposalDescription,
          content: currentProposalData.content,
          deliveryTerms: currentProposalData.deliveryTerms,
          paymentTerms: currentProposalData.paymentTerms,
          termsAndConditions: currentProposalData.termsAndConditions,
          footerContent: currentProposalData.footerContent,
          accountNumber: currentProposalData.accountNumber,
          accountName: currentProposalData.accountName,
          paymentMethod: currentProposalData.paymentMethod,
          currency: currentProposalData.currency,
          vatEnabled: currentProposalData.vatEnabled,
          vatRate: currentProposalData.vatRate,
          lineItems: currentProposalData.lineItems?.map((item: any) => ({
            ...item,
            id: undefined, // Will be regenerated
            proposal_id: undefined, // Will be set for new proposal
            created_at: undefined
          })) || [],
          logo: currentProposalData.logo,
          logoSize: currentProposalData.logoSize
        },
        createdAt: new Date().toISOString()
      };

      const updatedTemplates = [...templates, newTemplate];
      setTemplates(updatedTemplates);
      localStorage.setItem("proposalTemplates", JSON.stringify(updatedTemplates));

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
    }
  };

  const setAsDefault = (templateId: string) => {
    try {
      const updatedTemplates = templates.map(template => ({
        ...template,
        isDefault: template.id === templateId
      }));
      
      setTemplates(updatedTemplates);
      localStorage.setItem("proposalTemplates", JSON.stringify(updatedTemplates));

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
    onLoadTemplate(template.templateData);
    setIsLoadDialogOpen(false);
    toast({
      title: "Template loaded",
      description: `Template "${template.name}" has been applied to this proposal.`,
    });
  };

  const deleteTemplate = (templateId: string) => {
    const updatedTemplates = templates.filter(t => t.id !== templateId);
    setTemplates(updatedTemplates);
    localStorage.setItem("proposalTemplates", JSON.stringify(updatedTemplates));
    
    toast({
      title: "Template deleted",
      description: "Template has been removed.",
    });
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
            <Button onClick={saveAsTemplate}>
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Load Template Dialog */}
      <Dialog open={isLoadDialogOpen} onOpenChange={setIsLoadDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <FileTemplate size={16} className="mr-2" />
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
            {templates.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No templates saved yet. Save your first template using the "Save as Template" button.
              </p>
            ) : (
              templates.map((template) => (
                <div key={template.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium">{template.name}</h3>
                      {template.isDefault && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded mt-1 inline-block">
                          Default Template
                        </span>
                      )}
                      <p className="text-sm text-gray-500 mt-1">
                        Created: {new Date(template.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAsDefault(template.id)}
                        disabled={template.isDefault}
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
