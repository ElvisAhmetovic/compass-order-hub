
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Copy } from 'lucide-react';
import FontSelector, { FontSettings } from './FontSelector';

interface GlobalFontSettingsProps {
  globalSettings: FontSettings;
  onGlobalSettingsChange: (settings: FontSettings) => void;
  onApplyToAllFields: () => void;
}

const DEFAULT_FONT_SETTINGS: FontSettings = {
  fontFamily: 'Arial',
  fontSize: 12,
  fontWeight: '400',
  color: '#000000',
  textAlign: 'left',
  lineHeight: 1.2
};

const PRESET_STYLES = [
  {
    name: 'Professional Body',
    settings: { ...DEFAULT_FONT_SETTINGS, fontFamily: 'Arial', fontSize: 11 }
  },
  {
    name: 'Heading Large',
    settings: { ...DEFAULT_FONT_SETTINGS, fontFamily: 'Arial', fontSize: 16, fontWeight: '700' as const }
  },
  {
    name: 'Heading Medium',
    settings: { ...DEFAULT_FONT_SETTINGS, fontFamily: 'Arial', fontSize: 14, fontWeight: '600' as const }
  },
  {
    name: 'Small Text',
    settings: { ...DEFAULT_FONT_SETTINGS, fontFamily: 'Arial', fontSize: 9 }
  },
  {
    name: 'Currency/Numbers',
    settings: { ...DEFAULT_FONT_SETTINGS, fontFamily: 'Arial', fontSize: 11, textAlign: 'right' as const, fontWeight: '500' as const }
  }
];

const GlobalFontSettings: React.FC<GlobalFontSettingsProps> = ({
  globalSettings,
  onGlobalSettingsChange,
  onApplyToAllFields
}) => {
  const applyPreset = (preset: FontSettings) => {
    onGlobalSettingsChange(preset);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings size={16} />
            Global Font Settings
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={onApplyToAllFields}
            className="flex items-center gap-1"
          >
            <Copy size={14} />
            Apply to All Fields
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <FontSelector
          settings={globalSettings}
          onChange={onGlobalSettingsChange}
          label="Template Default Font"
          showAdvanced={true}
        />
        
        <div className="space-y-3">
          <h5 className="font-medium text-sm">Quick Presets</h5>
          <div className="grid grid-cols-2 gap-2">
            {PRESET_STYLES.map((preset, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => applyPreset(preset.settings)}
                className="justify-start text-xs h-8"
                style={{
                  fontFamily: preset.settings.fontFamily,
                  fontSize: '11px',
                  fontWeight: preset.settings.fontWeight
                }}
              >
                {preset.name}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GlobalFontSettings;
export { DEFAULT_FONT_SETTINGS };
