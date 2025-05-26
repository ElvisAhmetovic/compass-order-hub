
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { TemplateField } from './TemplateFieldMapper';

interface DynamicProposalFormProps {
  fields: TemplateField[];
  onFieldChange?: (fieldId: string, value: string) => void;
  values?: Record<string, string>;
}

const DynamicProposalForm: React.FC<DynamicProposalFormProps> = ({
  fields,
  onFieldChange,
  values = {}
}) => {
  const [formValues, setFormValues] = useState<Record<string, string>>(values);

  // Calculate field values for calculated fields
  const calculateFieldValue = (field: TemplateField): string => {
    if (field.type !== 'calculated' || !field.calculationFormula) {
      return formValues[field.id] || field.defaultValue || '';
    }

    let formula = field.calculationFormula;
    
    // Replace field references with actual values
    fields.forEach(f => {
      const value = formValues[f.id] || f.defaultValue || '0';
      const numericValue = parseFloat(value) || 0;
      formula = formula.replace(new RegExp(`\\{${f.name}\\}`, 'g'), numericValue.toString());
    });

    try {
      // Simple calculation - only allow basic math operations
      const result = eval(formula.replace(/[^0-9+\-*/.() ]/g, ''));
      return isNaN(result) ? '0' : result.toString();
    } catch {
      return '0';
    }
  };

  const handleFieldChange = (fieldId: string, value: string) => {
    const newValues = { ...formValues, [fieldId]: value };
    setFormValues(newValues);
    onFieldChange?.(fieldId, value);
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
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
              Calculated
            </span>
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
    <Card>
      <CardHeader>
        <CardTitle>Proposal Form Fields</CardTitle>
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
  );
};

export default DynamicProposalForm;
