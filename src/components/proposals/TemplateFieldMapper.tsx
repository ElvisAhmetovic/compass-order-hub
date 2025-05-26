
import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Trash2, Save, Plus, Edit3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface TemplateField {
  id: string;
  name: string;
  type: 'text' | 'textarea' | 'number' | 'date' | 'currency' | 'calculated';
  x: number;
  y: number;
  width: number;
  height: number;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  calculationFormula?: string; // For calculated fields
}

interface TemplateFieldMapperProps {
  templateImage: string;
  onFieldsChange?: (fields: TemplateField[]) => void;
}

const TemplateFieldMapper: React.FC<TemplateFieldMapperProps> = ({ 
  templateImage, 
  onFieldsChange 
}) => {
  const { toast } = useToast();
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [fields, setFields] = useState<TemplateField[]>([]);
  const [isCreatingField, setIsCreatingField] = useState(false);
  const [selectedField, setSelectedField] = useState<TemplateField | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);

  // Load saved fields on component mount
  React.useEffect(() => {
    const savedFields = localStorage.getItem('templateFields');
    if (savedFields) {
      const parsedFields = JSON.parse(savedFields);
      setFields(parsedFields);
      onFieldsChange?.(parsedFields);
    }
  }, [onFieldsChange]);

  const saveFields = useCallback((newFields: TemplateField[]) => {
    localStorage.setItem('templateFields', JSON.stringify(newFields));
    onFieldsChange?.(newFields);
    toast({
      title: "Fields saved",
      description: "Template field mapping has been saved."
    });
  }, [onFieldsChange, toast]);

  const getRelativeCoordinates = (e: React.MouseEvent) => {
    if (!imageRef.current || !containerRef.current) return { x: 0, y: 0 };
    
    const rect = imageRef.current.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();
    
    const x = ((e.clientX - rect.left) / rect.width) * 100; // Percentage
    const y = ((e.clientY - rect.top) / rect.height) * 100; // Percentage
    
    return { x, y };
  };

  const handleImageMouseDown = (e: React.MouseEvent) => {
    if (!isCreatingField) return;
    
    const coords = getRelativeCoordinates(e);
    setDragStart(coords);
  };

  const handleImageMouseUp = (e: React.MouseEvent) => {
    if (!isCreatingField || !dragStart) return;
    
    const coords = getRelativeCoordinates(e);
    const width = Math.abs(coords.x - dragStart.x);
    const height = Math.abs(coords.y - dragStart.y);
    
    if (width < 1 || height < 1) {
      setDragStart(null);
      return;
    }

    const newField: TemplateField = {
      id: crypto.randomUUID(),
      name: `Field ${fields.length + 1}`,
      type: 'text',
      x: Math.min(dragStart.x, coords.x),
      y: Math.min(dragStart.y, coords.y),
      width,
      height,
      defaultValue: '',
      placeholder: 'Enter value...',
      required: false
    };

    const newFields = [...fields, newField];
    setFields(newFields);
    setSelectedField(newField);
    setEditingField(newField.id);
    setIsCreatingField(false);
    setDragStart(null);
  };

  const updateField = (fieldId: string, updates: Partial<TemplateField>) => {
    const newFields = fields.map(field => 
      field.id === fieldId ? { ...field, ...updates } : field
    );
    setFields(newFields);
    
    if (selectedField?.id === fieldId) {
      setSelectedField({ ...selectedField, ...updates });
    }
  };

  const deleteField = (fieldId: string) => {
    const newFields = fields.filter(field => field.id !== fieldId);
    setFields(newFields);
    
    if (selectedField?.id === fieldId) {
      setSelectedField(null);
    }
    
    if (editingField === fieldId) {
      setEditingField(null);
    }
  };

  const clearAllFields = () => {
    setFields([]);
    setSelectedField(null);
    setEditingField(null);
    localStorage.removeItem('templateFields');
    onFieldsChange?.([]);
    toast({
      title: "Fields cleared",
      description: "All template fields have been removed."
    });
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex gap-2 flex-wrap">
        <Button
          onClick={() => setIsCreatingField(!isCreatingField)}
          variant={isCreatingField ? "default" : "outline"}
          className="flex items-center gap-2"
        >
          <Plus size={16} />
          {isCreatingField ? 'Cancel' : 'Add Field'}
        </Button>
        
        {fields.length > 0 && (
          <>
            <Button
              onClick={() => saveFields(fields)}
              className="flex items-center gap-2"
            >
              <Save size={16} />
              Save Fields
            </Button>
            
            <Button
              onClick={clearAllFields}
              variant="destructive"
              className="flex items-center gap-2"
            >
              <Trash2 size={16} />
              Clear All
            </Button>
          </>
        )}
      </div>

      {isCreatingField && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            Click and drag on the template image to create a new editable field.
          </p>
        </div>
      )}

      {/* Template Image with Overlay */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Template with Field Mapping</h3>
          <div 
            ref={containerRef}
            className="relative border rounded-lg overflow-hidden bg-gray-50"
            style={{ cursor: isCreatingField ? 'crosshair' : 'default' }}
          >
            <img
              ref={imageRef}
              src={templateImage}
              alt="Template"
              className="w-full h-auto"
              onMouseDown={handleImageMouseDown}
              onMouseUp={handleImageMouseUp}
              draggable={false}
            />
            
            {/* Field Overlays */}
            {fields.map((field) => (
              <div
                key={field.id}
                className={`absolute border-2 bg-blue-500 bg-opacity-20 cursor-pointer transition-all ${
                  selectedField?.id === field.id 
                    ? 'border-blue-500 bg-opacity-40' 
                    : 'border-green-500 hover:bg-opacity-30'
                }`}
                style={{
                  left: `${field.x}%`,
                  top: `${field.y}%`,
                  width: `${field.width}%`,
                  height: `${field.height}%`,
                }}
                onClick={() => {
                  setSelectedField(field);
                  setEditingField(field.id);
                }}
                title={field.name}
              >
                <div className="absolute -top-6 left-0 bg-black bg-opacity-75 text-white text-xs px-1 rounded">
                  {field.name}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Field Editor */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Field Properties</h3>
          {selectedField ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit3 size={16} />
                  Edit Field: {selectedField.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="fieldName">Field Name</Label>
                  <Input
                    id="fieldName"
                    value={selectedField.name}
                    onChange={(e) => updateField(selectedField.id, { name: e.target.value })}
                    placeholder="Field name..."
                  />
                </div>

                <div>
                  <Label htmlFor="fieldType">Field Type</Label>
                  <Select 
                    value={selectedField.type} 
                    onValueChange={(value: any) => updateField(selectedField.id, { type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="textarea">Multi-line Text</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="currency">Currency</SelectItem>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="calculated">Calculated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="placeholder">Placeholder</Label>
                  <Input
                    id="placeholder"
                    value={selectedField.placeholder || ''}
                    onChange={(e) => updateField(selectedField.id, { placeholder: e.target.value })}
                    placeholder="Placeholder text..."
                  />
                </div>

                <div>
                  <Label htmlFor="defaultValue">Default Value</Label>
                  {selectedField.type === 'textarea' ? (
                    <Textarea
                      id="defaultValue"
                      value={selectedField.defaultValue || ''}
                      onChange={(e) => updateField(selectedField.id, { defaultValue: e.target.value })}
                      placeholder="Default value..."
                    />
                  ) : (
                    <Input
                      id="defaultValue"
                      value={selectedField.defaultValue || ''}
                      onChange={(e) => updateField(selectedField.id, { defaultValue: e.target.value })}
                      placeholder="Default value..."
                    />
                  )}
                </div>

                {selectedField.type === 'calculated' && (
                  <div>
                    <Label htmlFor="formula">Calculation Formula</Label>
                    <Input
                      id="formula"
                      value={selectedField.calculationFormula || ''}
                      onChange={(e) => updateField(selectedField.id, { calculationFormula: e.target.value })}
                      placeholder="e.g., {price} * {quantity}"
                    />
                    <p className="text-xs text-gray-600 mt-1">
                      Use {`{fieldName}`} to reference other fields
                    </p>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Switch
                    id="required"
                    checked={selectedField.required || false}
                    onCheckedChange={(checked) => updateField(selectedField.id, { required: checked })}
                  />
                  <Label htmlFor="required">Required Field</Label>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Position X (%)</Label>
                    <Input
                      type="number"
                      value={selectedField.x.toFixed(1)}
                      onChange={(e) => updateField(selectedField.id, { x: parseFloat(e.target.value) || 0 })}
                      step="0.1"
                    />
                  </div>
                  <div>
                    <Label>Position Y (%)</Label>
                    <Input
                      type="number"
                      value={selectedField.y.toFixed(1)}
                      onChange={(e) => updateField(selectedField.id, { y: parseFloat(e.target.value) || 0 })}
                      step="0.1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Width (%)</Label>
                    <Input
                      type="number"
                      value={selectedField.width.toFixed(1)}
                      onChange={(e) => updateField(selectedField.id, { width: parseFloat(e.target.value) || 0 })}
                      step="0.1"
                    />
                  </div>
                  <div>
                    <Label>Height (%)</Label>
                    <Input
                      type="number"
                      value={selectedField.height.toFixed(1)}
                      onChange={(e) => updateField(selectedField.id, { height: parseFloat(e.target.value) || 0 })}
                      step="0.1"
                    />
                  </div>
                </div>

                <Button
                  onClick={() => deleteField(selectedField.id)}
                  variant="destructive"
                  size="sm"
                  className="w-full"
                >
                  <Trash2 size={16} className="mr-2" />
                  Delete Field
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center text-gray-500 p-8 border-2 border-dashed border-gray-300 rounded-lg">
              <Edit3 size={48} className="mx-auto mb-4 text-gray-400" />
              <p>Select a field to edit its properties</p>
              <p className="text-sm">or click "Add Field" to create a new one</p>
            </div>
          )}
        </div>
      </div>

      {/* Fields Summary */}
      {fields.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Mapped Fields ({fields.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {fields.map((field) => (
                <div 
                  key={field.id}
                  className={`flex justify-between items-center p-2 border rounded cursor-pointer ${
                    selectedField?.id === field.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                  onClick={() => setSelectedField(field)}
                >
                  <div>
                    <span className="font-medium">{field.name}</span>
                    <span className="text-sm text-gray-500 ml-2">({field.type})</span>
                  </div>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteField(field.id);
                    }}
                    variant="ghost"
                    size="sm"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TemplateFieldMapper;
