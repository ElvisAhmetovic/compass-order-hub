
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { FileImage, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TemplateField {
  id: string;
  type: 'text' | 'textarea' | 'number' | 'currency' | 'date' | 'calculated';
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  color: string;
  backgroundColor: string;
  defaultValue?: string;
  calculation?: string;
  required: boolean;
}

interface BackgroundTemplate {
  id: string;
  name: string;
  backgroundImage: string;
  fields: TemplateField[];
  width: number;
  height: number;
}

interface BackgroundTemplateFormProps {
  onDataChange: (data: any) => void;
  initialData?: any;
}

const BackgroundTemplateForm: React.FC<BackgroundTemplateFormProps> = ({ 
  onDataChange, 
  initialData = {} 
}) => {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<BackgroundTemplate | null>(null);
  const [templates, setTemplates] = useState<BackgroundTemplate[]>([]);
  const [fieldValues, setFieldValues] = useState<{ [key: string]: any }>({});

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    if (initialData.templateId) {
      const template = templates.find(t => t.id === initialData.templateId);
      if (template) {
        setSelectedTemplate(template);
        setFieldValues(initialData.fieldValues || {});
      }
    }
  }, [initialData, templates]);

  const loadTemplates = () => {
    const savedTemplates = JSON.parse(localStorage.getItem('backgroundTemplates') || '[]');
    setTemplates(savedTemplates);
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(template);
      setFieldValues({});
      onDataChange({
        templateId: template.id,
        templateName: template.name,
        fieldValues: {}
      });
    }
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    const newFieldValues = { ...fieldValues, [fieldId]: value };
    setFieldValues(newFieldValues);
    
    // Handle calculated fields
    if (selectedTemplate) {
      selectedTemplate.fields.forEach(field => {
        if (field.type === 'calculated' && field.calculation) {
          try {
            // Simple calculation parser - in a real app, you'd use a proper expression parser
            let calculation = field.calculation;
            Object.keys(newFieldValues).forEach(key => {
              const fieldName = selectedTemplate.fields.find(f => f.id === key)?.label.toLowerCase().replace(/\s+/g, '');
              if (fieldName) {
                calculation = calculation.replace(new RegExp(fieldName, 'g'), newFieldValues[key] || '0');
              }
            });
            
            // Basic calculation evaluation (unsafe in production - use a proper parser)
            const result = eval(calculation.replace(/[^0-9+\-*/.() ]/g, ''));
            if (!isNaN(result)) {
              newFieldValues[field.id] = result;
            }
          } catch (e) {
            console.log('Calculation error:', e);
          }
        }
      });
    }
    
    setFieldValues(newFieldValues);
    onDataChange({
      templateId: selectedTemplate?.id,
      templateName: selectedTemplate?.name,
      fieldValues: newFieldValues
    });
  };

  const renderField = (field: TemplateField) => {
    const value = fieldValues[field.id] || field.defaultValue || '';

    switch (field.type) {
      case 'textarea':
        return (
          <Textarea
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.label}
            className="min-h-[80px]"
          />
        );
      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field.id, parseFloat(e.target.value) || 0)}
            placeholder={field.label}
          />
        );
      case 'currency':
        return (
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">€</span>
            <Input
              type="number"
              step="0.01"
              value={value}
              onChange={(e) => handleFieldChange(field.id, parseFloat(e.target.value) || 0)}
              placeholder={field.label}
              className="pl-8"
            />
          </div>
        );
      case 'date':
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.label}
          />
        );
      case 'calculated':
        return (
          <Input
            value={value}
            readOnly
            placeholder={field.label}
            className="bg-gray-50"
          />
        );
      default:
        return (
          <Input
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.label}
          />
        );
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileImage size={20} />
            Background Template
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>Select Template</Label>
              <Select 
                value={selectedTemplate?.id || ''} 
                onValueChange={handleTemplateSelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a background template..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      <div className="flex items-center gap-2">
                        <span>{template.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {template.fields.length} fields
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {templates.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No templates available.</p>
                <p className="text-sm">Create a template first in the Template Management section.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedTemplate && (
        <Card>
          <CardHeader>
            <CardTitle>Template Preview & Field Values</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Template Preview */}
              <div>
                <Label className="text-base font-medium mb-2 block">Preview</Label>
                <div className="border border-gray-300 rounded-lg overflow-hidden">
                  <div
                    className="relative"
                    style={{ 
                      width: '100%', 
                      aspectRatio: `${selectedTemplate.width}/${selectedTemplate.height}`,
                      maxHeight: '400px'
                    }}
                  >
                    <img
                      src={selectedTemplate.backgroundImage}
                      alt={selectedTemplate.name}
                      className="w-full h-full object-contain"
                    />
                    
                    {selectedTemplate.fields.map((field) => (
                      <div
                        key={field.id}
                        className="absolute border border-blue-300 bg-blue-50 bg-opacity-80"
                        style={{
                          left: `${(field.x / selectedTemplate.width) * 100}%`,
                          top: `${(field.y / selectedTemplate.height) * 100}%`,
                          width: `${(field.width / selectedTemplate.width) * 100}%`,
                          height: `${(field.height / selectedTemplate.height) * 100}%`,
                          fontSize: `${Math.max(8, field.fontSize * 0.5)}px`,
                          fontWeight: field.fontWeight,
                          color: field.color,
                        }}
                      >
                        <div className="p-1 truncate text-xs">
                          {fieldValues[field.id] || field.defaultValue || field.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Field Values Form */}
              <div>
                <Label className="text-base font-medium mb-2 block">Field Values</Label>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {selectedTemplate.fields.map((field) => (
                    <div key={field.id}>
                      <Label className="flex items-center gap-2">
                        {field.label}
                        <Badge variant="outline" className="text-xs">
                          {field.type}
                        </Badge>
                        {field.required && <span className="text-red-500">*</span>}
                      </Label>
                      {renderField(field)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BackgroundTemplateForm;
