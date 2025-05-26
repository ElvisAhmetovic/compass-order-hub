
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Users, Calculator, FileSignature } from "lucide-react";
import { TemplateField } from './TemplateFieldMapper';

interface TemplatePresetsProps {
  onLoadPreset: (fields: TemplateField[]) => void;
}

const TemplatePresets: React.FC<TemplatePresetsProps> = ({ onLoadPreset }) => {
  const proposalPreset: TemplateField[] = [
    // Recipient Information
    {
      id: 'recipient-name',
      name: 'Recipient Name',
      type: 'text',
      x: 5,
      y: 15,
      width: 35,
      height: 3,
      placeholder: 'Name Surname',
      required: true
    },
    {
      id: 'recipient-address',
      name: 'Recipient Address',
      type: 'text',
      x: 5,
      y: 19,
      width: 35,
      height: 3,
      placeholder: 'Street, City, Postal Code',
      required: true
    },
    {
      id: 'recipient-email',
      name: 'Recipient Email',
      type: 'text',
      x: 5,
      y: 23,
      width: 35,
      height: 3,
      placeholder: 'email@example.com',
      required: true
    },
    {
      id: 'recipient-country',
      name: 'Recipient Country',
      type: 'text',
      x: 5,
      y: 27,
      width: 35,
      height: 3,
      placeholder: 'Country',
      defaultValue: 'Belgium'
    },
    
    // Proposal Details
    {
      id: 'proposal-number',
      name: 'Proposal Number',
      type: 'text',
      x: 65,
      y: 15,
      width: 30,
      height: 3,
      placeholder: 'AN-9993',
      required: true
    },
    {
      id: 'proposal-date',
      name: 'Proposal Date',
      type: 'date',
      x: 65,
      y: 19,
      width: 30,
      height: 3,
      required: true
    },
    {
      id: 'customer-reference',
      name: 'Customer Reference',
      type: 'text',
      x: 65,
      y: 23,
      width: 30,
      height: 3,
      placeholder: '7865'
    },
    {
      id: 'contact-person',
      name: 'Your Contact',
      type: 'text',
      x: 65,
      y: 27,
      width: 30,
      height: 3,
      placeholder: 'Thomas Klein'
    },
    
    // Proposal Content
    {
      id: 'proposal-tagline',
      name: 'Proposal Tagline',
      type: 'text',
      x: 5,
      y: 35,
      width: 90,
      height: 3,
      placeholder: 'Protect your online REPUTATION!',
      defaultValue: 'Protect your online REPUTATION!'
    },
    {
      id: 'introduction-text',
      name: 'Introduction Text',
      type: 'textarea',
      x: 5,
      y: 40,
      width: 90,
      height: 8,
      placeholder: 'Thank you for your enquiry...',
      defaultValue: 'Thank you for your enquiry. We will be happy to provide you with the requested non-binding offer.'
    },
    
    // Payment Information
    {
      id: 'account-number',
      name: 'Account Number',
      type: 'text',
      x: 5,
      y: 70,
      width: 40,
      height: 3,
      placeholder: '12356587965497'
    },
    {
      id: 'account-holder',
      name: 'Account Holder Name',
      type: 'text',
      x: 5,
      y: 74,
      width: 40,
      height: 3,
      placeholder: 'YOUR NAME'
    },
    {
      id: 'payment-method',
      name: 'Payment Method',
      type: 'text',
      x: 5,
      y: 78,
      width: 40,
      height: 3,
      placeholder: 'DEBIT CARD',
      defaultValue: 'DEBIT CARD'
    },
    
    // Terms and Conditions
    {
      id: 'terms-conditions',
      name: 'Terms and Conditions',
      type: 'textarea',
      x: 5,
      y: 85,
      width: 90,
      height: 10,
      placeholder: 'Terms and conditions text...',
      defaultValue: 'By placing your order, you agree to pay for the services included in this offer within 7 days of receipt of the invoice. The invoice will only be issued after the service has been provided.'
    }
  ];

  const presets = [
    {
      name: 'Standard Proposal Template',
      description: 'Complete proposal template with all standard fields',
      icon: FileText,
      fields: proposalPreset
    },
    {
      name: 'Client Information Only',
      description: 'Basic client and contact information fields',
      icon: Users,
      fields: proposalPreset.filter(f => f.id.includes('recipient') || f.id.includes('contact'))
    },
    {
      name: 'Financial Fields',
      description: 'Payment and calculation related fields',
      icon: Calculator,
      fields: proposalPreset.filter(f => f.id.includes('account') || f.id.includes('payment'))
    },
    {
      name: 'Document Structure',
      description: 'Title, introduction and terms fields',
      icon: FileSignature,
      fields: proposalPreset.filter(f => f.id.includes('tagline') || f.id.includes('introduction') || f.id.includes('terms'))
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Template Presets</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <p className="text-sm text-gray-600 mb-4">
            Quick start with predefined field layouts based on common proposal templates.
          </p>
          
          {presets.map((preset) => (
            <div key={preset.name} className="border rounded-lg p-3">
              <div className="flex items-start gap-3">
                <preset.icon size={20} className="text-blue-600 mt-1" />
                <div className="flex-1">
                  <h4 className="font-medium">{preset.name}</h4>
                  <p className="text-sm text-gray-600 mb-2">{preset.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                      {preset.fields.length} fields
                    </span>
                    <Button
                      onClick={() => onLoadPreset(preset.fields)}
                      size="sm"
                      variant="outline"
                    >
                      Load Preset
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TemplatePresets;
