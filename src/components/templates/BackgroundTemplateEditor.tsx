import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Upload, Save, Eye, Trash2, Move, Settings, Type, Palette, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import FontSelector, { FontSettings } from './FontSelector';
import GlobalFontSettings, { DEFAULT_FONT_SETTINGS } from './GlobalFontSettings';
import { templateService, BackgroundTemplate, TemplateField } from '@/services/templateService';
import { useAutoSave } from '@/hooks/useAutoSave';

interface BackgroundTemplateEditorProps {
  initialTemplate?: BackgroundTemplate;
  onTemplateChange?: (template: BackgroundTemplate) => void;
}

const BackgroundTemplateEditor: React.FC<BackgroundTemplateEditorProps> = ({ 
  initialTemplate,
  onTemplateChange 
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [template, setTemplate] = useState<BackgroundTemplate>(
    initialTemplate || {
      id: '',
      name: '',
      backgroundImage: '',
      fields: [],
      width: 794,
      height: 1123,
      globalFontSettings: DEFAULT_FONT_SETTINGS
    }
  );
  
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showFieldSettings, setShowFieldSettings] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [activeTab, setActiveTab] = useState('setup');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [isLoading, setIsLoading] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-save functionality
  const handleAutoSave = async (templateToSave: BackgroundTemplate) => {
    if (!user || !templateToSave.name) return;
    
    setSaveStatus('saving');
    try {
      const { data, error } = await templateService.saveTemplate(templateToSave);
      if (error) throw new Error(error);
      
      if (data && data.id !== templateToSave.id) {
        setTemplate(prev => ({ ...prev, id: data.id }));
      }
      
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Auto-save failed:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  useAutoSave({
    template,
    onSave: handleAutoSave,
    delay: 1500
  });

  // Update parent component when template changes
  useEffect(() => {
    if (onTemplateChange) {
      onTemplateChange(template);
    }
  }, [template, onTemplateChange]);

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
      required: false,
      fontSettings: { ...template.globalFontSettings }
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

    const field = template.fields.find(f => f.id === selectedField);
    if (!field) return;

    updateField(selectedField, {
      x: Math.max(0, Math.min(template.width - field.width, field.x + deltaX)),
      y: Math.max(0, Math.min(template.height - field.height, field.y + deltaY))
    });

    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const applyGlobalFontToAllFields = () => {
    setTemplate(prev => ({
      ...prev,
      fields: prev.fields.map(field => ({
        ...field,
        fontSettings: { ...prev.globalFontSettings }
      }))
    }));
    
    toast({
      title: "Font settings applied",
      description: "Global font settings have been applied to all fields."
    });
  };

  const saveTemplate = async () => {
    if (!template.name) {
      toast({
        title: "Template name required",
        description: "Please enter a name for your template.",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to save templates.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setSaveStatus('saving');
    
    try {
      const { data, error } = await templateService.saveTemplate(template);
      if (error) throw new Error(error);
      
      if (data) {
        setTemplate(data);
        setSaveStatus('saved');
        toast({
          title: "Template saved",
          description: "Your template has been saved successfully."
        });
      }
    } catch (error) {
      console.error('Save failed:', error);
      setSaveStatus('error');
      toast({
        title: "Save failed",
        description: error.message || "Failed to save template. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
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

  const renderSaveStatus = () => {
    switch (saveStatus) {
      case 'saving':
        return (
          <div className="flex items-center gap-2 text-blue-600">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-sm">Saving...</span>
          </div>
        );
      case 'saved':
        return (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle size={16} />
            <span className="text-sm">Saved</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle size={16} />
            <span className="text-sm">Save failed</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <CardTitle>Professional Template Editor</CardTitle>
              {renderSaveStatus()}
            </div>
            <div className="flex gap-2">
              <Button
                variant={previewMode ? "default" : "outline"}
                onClick={() => setPreviewMode(!previewMode)}
                className="flex items-center gap-2"
              >
                <Eye size={16} />
                {previewMode ? "Edit Mode" : "Preview"}
              </Button>
              <Button 
                onClick={saveTemplate} 
                disabled={isLoading || !template.name}
                className="flex items-center gap-2"
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Save Template
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="setup">Setup</TabsTrigger>
              <TabsTrigger value="design">Design</TabsTrigger>
              <TabsTrigger value="typography">Typography</TabsTrigger>
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

            <TabsContent value="typography" className="space-y-4">
              <GlobalFontSettings
                globalSettings={template.globalFontSettings}
                onGlobalSettingsChange={(settings) => 
                  setTemplate(prev => ({ ...prev, globalFontSettings: settings }))
                }
                onApplyToAllFields={applyGlobalFontToAllFields}
              />
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
                          left: `${field.x}px`,
                          top: `${field.y}px`,
                          width: `${field.width}px`,
                          height: `${field.height}px`,
                          backgroundColor: previewMode ? 'transparent' : 
                            (selectedField === field.id ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255, 255, 255, 0.8)')
                        }}
                        onMouseDown={(e) => handleMouseDown(e, field.id)}
                      >
                        <div 
                          className="p-1 truncate h-full flex items-center"
                          style={{
                            fontFamily: field.fontSettings.fontFamily,
                            fontSize: `${field.fontSettings.fontSize}px`,
                            fontWeight: field.fontSettings.fontWeight,
                            color: field.fontSettings.color,
                            textAlign: field.fontSettings.textAlign,
                            lineHeight: field.fontSettings.lineHeight
                          }}
                        >
                          {previewMode ? (
                            field.type === 'textarea' ? (
                              <textarea
                                className="w-full h-full border-none outline-none resize-none bg-transparent"
                                placeholder={field.defaultValue || field.label}
                                style={{ 
                                  fontFamily: field.fontSettings.fontFamily,
                                  fontSize: `${field.fontSettings.fontSize}px`,
                                  fontWeight: field.fontSettings.fontWeight,
                                  color: field.fontSettings.color,
                                  textAlign: field.fontSettings.textAlign,
                                  lineHeight: field.fontSettings.lineHeight
                                }}
                              />
                            ) : (
                              <input
                                type={field.type === 'currency' || field.type === 'number' ? 'number' : 
                                      field.type === 'date' ? 'date' : 'text'}
                                className="w-full h-full border-none outline-none bg-transparent"
                                placeholder={field.defaultValue || field.label}
                                style={{ 
                                  fontFamily: field.fontSettings.fontFamily,
                                  fontSize: `${field.fontSettings.fontSize}px`,
                                  fontWeight: field.fontSettings.fontWeight,
                                  color: field.fontSettings.color,
                                  textAlign: field.fontSettings.textAlign,
                                  lineHeight: field.fontSettings.lineHeight
                                }}
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
                              variant="outline"
                              className="h-6 w-6 p-0"
                              onClick={() => setShowFieldSettings(true)}
                            >
                              <Type size={12} />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-6 w-6 p-0"
                              onClick={() => deleteField(field.id)}
                            >
                              <Trash2 size={12} />
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

      {/* Enhanced Field Settings Dialog */}
      {showFieldSettings && selectedFieldData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-[500px] max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings size={16} />
                Field Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Field Settings */}
              <div className="space-y-4">
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

                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <Label>X Position</Label>
                    <Input
                      type="number"
                      value={Math.round(selectedFieldData.x)}
                      onChange={(e) => updateField(selectedField!, { x: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label>Y Position</Label>
                    <Input
                      type="number"
                      value={Math.round(selectedFieldData.y)}
                      onChange={(e) => updateField(selectedField!, { y: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label>Width</Label>
                    <Input
                      type="number"
                      value={Math.round(selectedFieldData.width)}
                      onChange={(e) => updateField(selectedField!, { width: parseInt(e.target.value) || 50 })}
                    />
                  </div>
                  <div>
                    <Label>Height</Label>
                    <Input
                      type="number"
                      value={Math.round(selectedFieldData.height)}
                      onChange={(e) => updateField(selectedField!, { height: parseInt(e.target.value) || 25 })}
                    />
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
              </div>

              {/* Font Settings for This Field */}
              <FontSelector
                settings={selectedFieldData.fontSettings}
                onChange={(fontSettings) => updateField(selectedField!, { fontSettings })}
                label="Field Font Settings"
                showAdvanced={true}
              />

              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => updateField(selectedField!, { fontSettings: { ...template.globalFontSettings } })}
                >
                  Use Global Font
                </Button>
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
