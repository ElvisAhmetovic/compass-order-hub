
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BackgroundTemplate {
  id: string;
  name: string;
  backgroundImage: string;
  fields: any[];
  width: number;
  height: number;
}

interface TemplateSelectorProps {
  onSelectTemplate: (template: BackgroundTemplate) => void;
  onEditTemplate: (template: BackgroundTemplate) => void;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({ 
  onSelectTemplate, 
  onEditTemplate 
}) => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<BackgroundTemplate[]>([]);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = () => {
    const savedTemplates = JSON.parse(localStorage.getItem('backgroundTemplates') || '[]');
    setTemplates(savedTemplates);
  };

  const deleteTemplate = (templateId: string) => {
    const updatedTemplates = templates.filter(t => t.id !== templateId);
    setTemplates(updatedTemplates);
    localStorage.setItem('backgroundTemplates', JSON.stringify(updatedTemplates));
    
    toast({
      title: "Template deleted",
      description: "The template has been removed successfully."
    });
  };

  const duplicateTemplate = (template: BackgroundTemplate) => {
    const duplicatedTemplate = {
      ...template,
      id: `template_${Date.now()}`,
      name: `${template.name} (Copy)`
    };
    
    const updatedTemplates = [...templates, duplicatedTemplate];
    setTemplates(updatedTemplates);
    localStorage.setItem('backgroundTemplates', JSON.stringify(updatedTemplates));
    
    toast({
      title: "Template duplicated",
      description: "A copy of the template has been created."
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Saved Templates</h3>
        <Badge variant="outline">{templates.length} templates</Badge>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-gray-500">
              <p>No templates saved yet.</p>
              <p className="text-sm">Create your first template to get started.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-sm truncate">{template.name}</CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {template.fields.length} fields
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {template.backgroundImage && (
                    <div className="aspect-[3/4] border rounded overflow-hidden">
                      <img
                        src={template.backgroundImage}
                        alt={template.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-600">
                    Size: {template.width} × {template.height}px
                  </div>
                  
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="default"
                      className="flex-1"
                      onClick={() => onSelectTemplate(template)}
                    >
                      Use Template
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEditTemplate(template)}
                    >
                      <Edit size={14} />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => duplicateTemplate(template)}
                    >
                      <Copy size={14} />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteTemplate(template.id)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TemplateSelector;
