import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { emailTemplateService, EmailTemplate } from "@/services/emailTemplateService";
import { FileText, Star } from "lucide-react";

interface TemplateSelectorProps {
  type: string;
  selectedTemplateId: string | null;
  onTemplateSelect: (template: EmailTemplate | null) => void;
  disabled?: boolean;
}

const TemplateSelector = ({
  type,
  selectedTemplateId,
  onTemplateSelect,
  disabled = false,
}: TemplateSelectorProps) => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const data = await emailTemplateService.getTemplates(type);
        setTemplates(data);

        // Auto-select default template if none selected
        if (!selectedTemplateId) {
          const defaultTemplate = data.find((t) => t.is_default);
          if (defaultTemplate) {
            onTemplateSelect(defaultTemplate);
          } else if (data.length > 0) {
            onTemplateSelect(data[0]);
          }
        }
      } catch (error) {
        console.error("Error loading templates:", error);
      } finally {
        setLoading(false);
      }
    };

    loadTemplates();
  }, [type]);

  const handleValueChange = (value: string) => {
    const template = templates.find((t) => t.id === value);
    onTemplateSelect(template || null);
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <Label>Email Template</Label>
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="space-y-2">
        <Label>Email Template</Label>
        <p className="text-sm text-muted-foreground">No templates available</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <FileText className="h-4 w-4" />
        Email Template
      </Label>
      <Select
        value={selectedTemplateId || undefined}
        onValueChange={handleValueChange}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select a template" />
        </SelectTrigger>
        <SelectContent>
          {templates.map((template) => (
            <SelectItem key={template.id} value={template.id}>
              <div className="flex items-center gap-2">
                <span>{template.name}</span>
                {template.is_default && (
                  <Badge variant="secondary" className="text-xs px-1.5 py-0">
                    <Star className="h-3 w-3 mr-1 fill-current" />
                    Default
                  </Badge>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default TemplateSelector;
