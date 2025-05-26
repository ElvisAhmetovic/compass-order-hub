
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export interface FontSettings {
  fontFamily: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold' | '300' | '400' | '500' | '600' | '700';
  color: string;
  textAlign: 'left' | 'center' | 'right' | 'justify';
  lineHeight: number;
}

interface FontSelectorProps {
  settings: FontSettings;
  onChange: (settings: FontSettings) => void;
  label?: string;
  showAdvanced?: boolean;
}

// Professional, web-safe fonts that render well in PDFs
const PROFESSIONAL_FONTS = [
  { value: 'Arial', label: 'Arial' },
  { value: 'Calibri', label: 'Calibri' },
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Lato', label: 'Lato' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Helvetica', label: 'Helvetica' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Verdana', label: 'Verdana' },
  { value: 'Trebuchet MS', label: 'Trebuchet MS' },
  { value: 'Source Sans Pro', label: 'Source Sans Pro' },
  { value: 'Inter', label: 'Inter' }
];

const FONT_WEIGHTS = [
  { value: '300', label: 'Light' },
  { value: '400', label: 'Regular' },
  { value: '500', label: 'Medium' },
  { value: '600', label: 'Semi-bold' },
  { value: '700', label: 'Bold' }
];

const TEXT_ALIGNMENTS = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Right' },
  { value: 'justify', label: 'Justify' }
];

const FontSelector: React.FC<FontSelectorProps> = ({ 
  settings, 
  onChange, 
  label = "Font Settings",
  showAdvanced = true 
}) => {
  const updateSetting = (key: keyof FontSettings, value: any) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
      <h4 className="font-medium text-sm">{label}</h4>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-xs">Font Family</Label>
          <Select value={settings.fontFamily} onValueChange={(value) => updateSetting('fontFamily', value)}>
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROFESSIONAL_FONTS.map(font => (
                <SelectItem key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                  {font.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label className="text-xs">Font Size</Label>
          <Input
            type="number"
            value={settings.fontSize}
            onChange={(e) => updateSetting('fontSize', parseInt(e.target.value))}
            min="8"
            max="72"
            className="h-8"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-xs">Font Weight</Label>
          <Select value={settings.fontWeight} onValueChange={(value) => updateSetting('fontWeight', value)}>
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_WEIGHTS.map(weight => (
                <SelectItem key={weight.value} value={weight.value}>
                  {weight.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label className="text-xs">Color</Label>
          <div className="flex gap-2">
            <Input
              type="color"
              value={settings.color}
              onChange={(e) => updateSetting('color', e.target.value)}
              className="h-8 w-16 p-1"
            />
            <Input
              type="text"
              value={settings.color}
              onChange={(e) => updateSetting('color', e.target.value)}
              placeholder="#000000"
              className="h-8 flex-1 text-xs"
            />
          </div>
        </div>
      </div>

      {showAdvanced && (
        <>
          <Separator />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Text Alignment</Label>
              <Select value={settings.textAlign} onValueChange={(value) => updateSetting('textAlign', value)}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEXT_ALIGNMENTS.map(align => (
                    <SelectItem key={align.value} value={align.value}>
                      {align.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-xs">Line Height</Label>
              <Input
                type="number"
                value={settings.lineHeight}
                onChange={(e) => updateSetting('lineHeight', parseFloat(e.target.value))}
                min="0.8"
                max="3"
                step="0.1"
                className="h-8"
              />
            </div>
          </div>
        </>
      )}

      {/* Font Preview */}
      <div className="mt-4 p-3 border rounded bg-white">
        <Label className="text-xs text-gray-600">Preview:</Label>
        <div
          style={{
            fontFamily: settings.fontFamily,
            fontSize: `${settings.fontSize}px`,
            fontWeight: settings.fontWeight,
            color: settings.color,
            textAlign: settings.textAlign,
            lineHeight: settings.lineHeight
          }}
          className="mt-1"
        >
          Sample text with selected font settings
        </div>
      </div>
    </div>
  );
};

export default FontSelector;
