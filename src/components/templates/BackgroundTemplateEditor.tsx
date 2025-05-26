
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Upload, Save, Eye, Trash2, Move, Settings } from 'lucide-react';
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

const BackgroundTemplateEditor = () => {
  const { toast } = useToast();
  const [template, setTemplate] = useState<BackgroundTemplate>({
    id: '',
    name: '',
    backgroundImage: '',
    fields: [],
    width: 794, // A4 width in pixels at 96 DPI
    height: 1123 // A4 height in pixels at 96 DPI
  });
  
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [showFieldSettings, setShowFieldSettings] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBackgroundUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          setTemplate(prev => ({
            ...prev,
            backgroundImage: e.target?.result as string,
            width: img.width,
            height: img.height
          }));
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const addField = (type: TemplateField['type']) => {
    const newField: TemplateField = {
      id: `field_${Date.now()}`,
      type,
      label: `New ${type} field`,
      x: 50,
      y: 50,
      width: type === 'textarea' ? 200 : 150,
      height: type === 'textarea' ? 80 : 25,
      fontSize: 12,
      fontWeight: 'normal',
      color: '#000000',
      backgroundColor: 'transparent',
      required: false
    };
    
    setTemplate(prev => ({
      ...prev,
      fields: [...prev.fields, newField]
    }));
    setSelectedField(newField.id);
  };

  const updateField = (fieldId: string, updates: Partial<TemplateField>) => {
    setTemplate(prev => ({
      ...prev,
      fields: prev.fields.map(field => 
        field.id === fieldId ? { ...field, ...updates } : field
      )
    }));
  };

  const deleteField = (fieldId: string) => {
    setTemplate(prev => ({
      ...prev,
      fields: prev.fields.filter(field => field.id !== fieldId)
    }));
    if (selectedField === fieldId) {
      setSelectedField(null);
    }
  };

  const handleMouseDown = (e: React.MouseEvent, fieldId: string) => {
    if (previewMode) return;
    
    e.preventDefault();
    setSelectedField(fieldId);
    setIsDragging(true);
    setDragStart({
      x: e.clientX,
      y: e.clientY
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectedField || previewMode) return;

    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;

    updateField(selectedField, {
      x: Math.max(0, template.fields.find(f => f.id === selectedField)!.x + deltaX),
      y: Math.max(0, template.fields.find(f => f.id === selectedField)!.y + deltaY)
    });

    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const saveTemplate = () => {
    if (!template.name) {
      toast({
        title: "Template name required",
        description: "Please enter a name for your template.",
        variant: "destructive"
      });
      return;
    }

    const savedTemplates = JSON.parse(localStorage.getItem('backgroundTemplates') || '[]');
    const templateToSave = {
      ...template,
      id: template.id || `template_${Date.now()}`
    };
    
    const existingIndex = savedTemplates.findIndex((t: BackgroundTemplate) => t.id === templateToSave.id);
    if (existingIndex >= 0) {
      savedTemplates[existingIndex] = templateToSave;
    } else {
      savedTemplates.push(templateToSave);
    }
    
    localStorage.setItem('backgroundTemplates', JSON.stringify(savedTemplates));
    
    toast({
      title: "Template saved",
      description: "Your template has been saved successfully."
    });
  };

  const selectedFieldData = selectedField ? template.fields.find(f => f.id === selectedField) : null;

  const fieldTypeOptions = [
    { value: 'text', label: 'Text Field' },
    { value: 'textarea', label: 'Multi-line Text' },
    { value: 'number', label: 'Number Field' },
    { value: 'currency', label: 'Currency Field' },
    { value: 'date', label: 'Date Field' },
    { value: 'calculated', label: 'Calculated Field' }
  ];

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Background Template Editor</CardTitle>
            <div className="flex gap-2">
              <Button
                variant={previewMode ? "default" : "outline"}
                onClick={() => setPreviewMode(!previewMode)}
                className="flex items-center gap-2"
              >
                <Eye size={16} />
                {previewMode ? "Edit Mode" : "Preview"}
              </Button>
              <Button onClick={saveTemplate} className="flex items-center gap-2">
                <Save size={16} />
                Save Template
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="design" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="setup">Setup</TabsTrigger>
              <TabsTrigger value="design">Design</TabsTrigger>
              <TabsTrigger value="fields">Fields</TabsTrigger>
            </TabsList>
            
            <TabsContent value="setup" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Template Name</Label>
                  <Input
                    value={template.name}
                    onChange={(e) => setTemplate(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter template name"
                  />
                </div>
                <div>
                  <Label>Background Image</Label>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2"
                    >
                      <Upload size={16} />
                      Upload Image
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleBackgroundUpload}
                      className="hidden"
                    />
                  </div>
                  {template.backgroundImage && (
                    <p className="text-sm text-green-600 mt-1">✓ Background image loaded</p>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="design" className="space-y-4">
              <div className="flex gap-4 mb-4">
                <div className="flex gap-2 flex-wrap">
                  {fieldTypeOptions.map(option => (
                    <Button
                      key={option.value}
                      variant="outline"
                      size="sm"
                      onClick={() => addField(option.value as TemplateField['type'])}
                      disabled={!template.backgroundImage || previewMode}
                    >
                      + {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="border border-gray-300 relative overflow-auto max-h-[600px]">
                {template.backgroundImage ? (
                  <div
                    ref={containerRef}
                    className="relative inline-block"
                    style={{ width: template.width, height: template.height }}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                  >
                    <img
                      src={template.backgroundImage}
                      alt="Template background"
                      className="w-full h-full object-contain"
                      draggable={false}
                    />
                    
                    {template.fields.map((field) => (
                      <div
                        key={field.id}
                        className={`absolute border-2 cursor-move ${
                          selectedField === field.id 
                            ? 'border-blue-500 bg-blue-100' 
                            : 'border-gray-400 bg-white'
                        } ${previewMode ? 'cursor-default' : ''}`}
                        style={{
                          left: field.x,
                          top: field.y,
                          width: field.width,
                          height: field.height,
                          fontSize: field.fontSize,
                          fontWeight: field.fontWeight,
                          color: field.color,
                          backgroundColor: previewMode ? field.backgroundColor : 
                            (selectedField === field.id ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255, 255, 255, 0.8)')
                        }}
                        onMouseDown={(e) => handleMouseDown(e, field.id)}
                      >
                        <div className="p-1 truncate">
                          {previewMode ? (
                            field.type === 'textarea' ? (
                              <textarea
                                className="w-full h-full border-none outline-none resize-none bg-transparent"
                                placeholder={field.defaultValue || field.label}
                                style={{ fontSize: field.fontSize, color: field.color }}
                              />
                            ) : (
                              <input
                                type={field.type === 'currency' || field.type === 'number' ? 'number' : 
                                      field.type === 'date' ? 'date' : 'text'}
                                className="w-full h-full border-none outline-none bg-transparent"
                                placeholder={field.defaultValue || field.label}
                                style={{ fontSize: field.fontSize, color: field.color }}
                              />
                            )
                          ) : (
                            <span className="text-xs">{field.label}</span>
                          )}
                        </div>
                        
                        {!previewMode && selectedField === field.id && (
                          <div className="absolute -top-6 -right-6 flex gap-1">
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-6 w-6 p-0"
                              onClick={() => deleteField(field.id)}
                            >
                              <Trash2 size={12} />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 w-6 p-0"
                              onClick={() => setShowFieldSettings(true)}
                            >
                              <Settings size={12} />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 text-gray-500">
                    Upload a background image to start designing your template
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="fields" className="space-y-4">
              <div className="grid gap-4">
                {template.fields.length === 0 ? (
                  <p className="text-gray-500">No fields added yet. Go to the Design tab to add fields.</p>
                ) : (
                  template.fields.map((field) => (
                    <Card key={field.id} className={selectedField === field.id ? 'border-blue-500' : ''}>
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline">{field.type}</Badge>
                              <span className="font-medium">{field.label}</span>
                            </div>
                            <p className="text-sm text-gray-600">
                              Position: ({field.x}, {field.y}) | Size: {field.width}×{field.height}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedField(field.id);
                                setShowFieldSettings(true);
                              }}
                            >
                              <Settings size={14} />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteField(field.id)}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Field Settings Dialog */}
      {showFieldSettings && selectedFieldData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-96 max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Field Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Label</Label>
                <Input
                  value={selectedFieldData.label}
                  onChange={(e) => updateField(selectedField!, { label: e.target.value })}
                />
              </div>
              
              <div>
                <Label>Type</Label>
                <Select
                  value={selectedFieldData.type}
                  onValueChange={(value) => updateField(selectedField!, { type: value as TemplateField['type'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fieldTypeOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Width</Label>
                  <Input
                    type="number"
                    value={selectedFieldData.width}
                    onChange={(e) => updateField(selectedField!, { width: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Height</Label>
                  <Input
                    type="number"
                    value={selectedFieldData.height}
                    onChange={(e) => updateField(selectedField!, { height: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Font Size</Label>
                  <Input
                    type="number"
                    value={selectedFieldData.fontSize}
                    onChange={(e) => updateField(selectedField!, { fontSize: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Font Weight</Label>
                  <Select
                    value={selectedFieldData.fontWeight}
                    onValueChange={(value) => updateField(selectedField!, { fontWeight: value as 'normal' | 'bold' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="bold">Bold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Default Value</Label>
                {selectedFieldData.type === 'textarea' ? (
                  <Textarea
                    value={selectedFieldData.defaultValue || ''}
                    onChange={(e) => updateField(selectedField!, { defaultValue: e.target.value })}
                    placeholder="Enter default text..."
                  />
                ) : (
                  <Input
                    value={selectedFieldData.defaultValue || ''}
                    onChange={(e) => updateField(selectedField!, { defaultValue: e.target.value })}
                    placeholder="Enter default value..."
                  />
                )}
              </div>

              {selectedFieldData.type === 'calculated' && (
                <div>
                  <Label>Calculation Formula</Label>
                  <Input
                    value={selectedFieldData.calculation || ''}
                    onChange={(e) => updateField(selectedField!, { calculation: e.target.value })}
                    placeholder="e.g., quantity * unitPrice"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowFieldSettings(false)}>
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default BackgroundTemplateEditor;
