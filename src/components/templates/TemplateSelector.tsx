
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit, Copy, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { templateService, BackgroundTemplate } from '@/services/templateService';
import { useAuth } from '@/context/AuthContext';

interface TemplateSelectorProps {
  onSelectTemplate: (template: BackgroundTemplate) => void;
  onEditTemplate: (template: BackgroundTemplate) => void;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({ 
  onSelectTemplate, 
  onEditTemplate 
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [templates, setTemplates] = useState<BackgroundTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, [user]);

  const loadTemplates = async () => {
    if (!user) {
      setTemplates([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const userTemplates = await templateService.getUserTemplates();
      setTemplates(userTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast({
        title: "Error loading templates",
        description: "Failed to load your templates. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTemplate = async (templateId: string) => {
    try {
      const { success, error } = await templateService.deleteTemplate(templateId);
      if (!success) throw new Error(error || 'Delete failed');
      
      setTemplates(prev => prev.filter(t => t.id !== templateId));
      toast({
        title: "Template deleted",
        description: "The template has been removed successfully."
      });
    } catch (error) {
      console.error('Delete failed:', error);
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete template. Please try again.",
        variant: "destructive"
      });
    }
  };

  const duplicateTemplate = async (template: BackgroundTemplate) => {
    try {
      const duplicatedTemplate: BackgroundTemplate = {
        ...template,
        id: '',
        name: `${template.name} (Copy)`,
        fields: template.fields.map(field => ({
          ...field,
          id: `field_${Date.now()}_${Math.random()}`
        }))
      };
      
      const { data, error } = await templateService.saveTemplate(duplicatedTemplate);
      if (error) throw new Error(error);
      
      if (data) {
        setTemplates(prev => [data, ...prev]);
        toast({
          title: "Template duplicated",
          description: "A copy of the template has been created."
        });
      }
    } catch (error) {
      console.error('Duplicate failed:', error);
      toast({
        title: "Duplicate failed",
        description: error.message || "Failed to duplicate template. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-gray-500">
            <p>Please log in to view your templates.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <Loader2 className="animate-spin mr-2" />
            <span>Loading templates...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

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
