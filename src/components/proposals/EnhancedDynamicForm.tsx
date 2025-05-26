
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Plus, Trash2, Calculator } from "lucide-react";
import { TemplateField } from './TemplateFieldMapper';

interface ServiceItem {
  id: string;
  description: string;
  price: number;
  quantity: number;
  total: number;
}

interface EnhancedDynamicFormProps {
  fields: TemplateField[];
  onFieldChange?: (fieldId: string, value: string) => void;
  values?: Record<string, string>;
}

const EnhancedDynamicForm: React.FC<EnhancedDynamicFormProps> = ({
  fields,
  onFieldChange,
  values = {}
}) => {
  const [formValues, setFormValues] = useState<Record<string, string>>(values);
  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([
    { id: '1', description: '', price: 0, quantity: 1, total: 0 }
  ]);

  // Calculate totals
  const subtotal = serviceItems.reduce((sum, item) => sum + item.total, 0);
  const vatPercentage = parseFloat(formValues['vat-percentage'] || '0');
  const vatAmount = (subtotal * vatPercentage) / 100;
  const grandTotal = subtotal + vatAmount;

  // Calculate field values for calculated fields
  const calculateFieldValue = (field: TemplateField): string => {
    if (field.type !== 'calculated' || !field.calculationFormula) {
      return formValues[field.id] || field.defaultValue || '';
    }

    let formula = field.calculationFormula;
    
    // Handle special calculations
    if (formula.includes('subtotal')) {
      formula = formula.replace(/subtotal/g, subtotal.toString());
    }
    if (formula.includes('vat')) {
      formula = formula.replace(/vat/g, vatAmount.toString());
    }
    if (formula.includes('total')) {
      formula = formula.replace(/total/g, grandTotal.toString());
    }

    // Replace field references with actual values
    fields.forEach(f => {
      const value = formValues[f.id] || f.defaultValue || '0';
      const numericValue = parseFloat(value) || 0;
      formula = formula.replace(new RegExp(`\\{${f.name}\\}`, 'g'), numericValue.toString());
    });

    try {
      const result = eval(formula.replace(/[^0-9+\-*/.() ]/g, ''));
      return isNaN(result) ? '0' : result.toFixed(2);
    } catch {
      return '0';
    }
  };

  const handleFieldChange = (fieldId: string, value: string) => {
    const newValues = { ...formValues, [fieldId]: value };
    setFormValues(newValues);
    onFieldChange?.(fieldId, value);
  };

  const handleServiceItemChange = (id: string, field: keyof ServiceItem, value: string | number) => {
    setServiceItems(items => items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'price' || field === 'quantity') {
          updatedItem.total = updatedItem.price * updatedItem.quantity;
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const addServiceItem = () => {
    const newItem: ServiceItem = {
      id: Date.now().toString(),
      description: '',
      price: 0,
      quantity: 1,
      total: 0
    };
    setServiceItems([...serviceItems, newItem]);
  };

  const removeServiceItem = (id: string) => {
    if (serviceItems.length > 1) {
      setServiceItems(serviceItems.filter(item => item.id !== id));
    }
  };

  const renderField = (field: TemplateField) => {
    const value = field.type === 'calculated' 
      ? calculateFieldValue(field)
      : formValues[field.id] || field.defaultValue || '';

    const commonProps = {
      id: field.id,
      value,
      placeholder: field.placeholder,
      disabled: field.type === 'calculated',
      required: field.required
    };

    switch (field.type) {
      case 'textarea':
        return (
          <Textarea
            {...commonProps}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            className="min-h-[100px]"
          />
        );

      case 'number':
        return (
          <Input
            {...commonProps}
            type="number"
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
          />
        );

      case 'currency':
        return (
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">€</span>
            <Input
              {...commonProps}
              type="number"
              step="0.01"
              className="pl-8"
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
            />
          </div>
        );

      case 'date':
        return (
          <div className="relative">
            <Input
              {...commonProps}
              type="date"
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
            />
            <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          </div>
        );

      case 'calculated':
        return (
          <div className="relative">
            <Input
              {...commonProps}
              className="bg-gray-50"
            />
            <Calculator className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          </div>
        );

      default: // text
        return (
          <Input
            {...commonProps}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
          />
        );
    }
  };

  if (fields.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-gray-500">No fields mapped yet.</p>
          <p className="text-sm text-gray-400">Use the Template Field Mapper to create editable fields.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Regular Fields */}
      <Card>
        <CardHeader>
          <CardTitle>Template Fields</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {fields.map((field) => (
            <div key={field.id}>
              <Label htmlFor={field.id} className="flex items-center gap-2">
                {field.name}
                {field.required && <span className="text-red-500">*</span>}
                {field.type === 'calculated' && (
                  <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                    Auto-calculated
                  </span>
                )}
              </Label>
              {renderField(field)}
              {field.type === 'calculated' && field.calculationFormula && (
                <p className="text-xs text-gray-500 mt-1">
                  Formula: {field.calculationFormula}
                </p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Services Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Services / Products</CardTitle>
            <Button onClick={addServiceItem} size="sm" className="flex items-center gap-2">
              <Plus size={16} />
              Add Service
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {serviceItems.map((item, index) => (
              <div key={item.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium">Service {index + 1}</h4>
                  {serviceItems.length > 1 && (
                    <Button
                      onClick={() => removeServiceItem(item.id)}
                      variant="ghost"
                      size="sm"
                    >
                      <Trash2 size={16} />
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="md:col-span-2">
                    <Label>Description</Label>
                    <Textarea
                      value={item.description}
                      onChange={(e) => handleServiceItemChange(item.id, 'description', e.target.value)}
                      placeholder="Service description..."
                      className="min-h-[80px]"
                    />
                  </div>
                  
                  <div>
                    <Label>Price (€)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.price}
                      onChange={(e) => handleServiceItemChange(item.id, 'price', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div>
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleServiceItemChange(item.id, 'quantity', parseInt(e.target.value) || 1)}
                      placeholder="1"
                    />
                  </div>
                </div>
                
                <div className="text-right">
                  <span className="text-sm text-gray-600">Total: </span>
                  <span className="font-bold">€{item.total.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>€{subtotal.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span>VAT:</span>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  step="0.01"
                  value={vatPercentage}
                  onChange={(e) => handleFieldChange('vat-percentage', e.target.value)}
                  placeholder="0"
                  className="w-20 text-right"
                />
                <span>% = €{vatAmount.toFixed(2)}</span>
              </div>
            </div>
            
            <hr className="my-2" />
            
            <div className="flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span>€{grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedDynamicForm;
