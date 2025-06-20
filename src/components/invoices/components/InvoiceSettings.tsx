
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { LANGUAGES, CURRENCIES } from "../constants";

interface InvoiceSettingsProps {
  language: string;
  currency: string;
  invoiceNumberPrefix: string;
  vatRate: number;
  vatEnabled: boolean;
  customTerms: string;
  onLanguageChange: (language: string) => void;
  onCurrencyChange: (currency: string) => void;
  onInvoiceNumberPrefixChange: (prefix: string) => void;
  onVatRateChange: (rate: number) => void;
  onVatEnabledChange: (enabled: boolean) => void;
  onCustomTermsChange: (terms: string) => void;
}

export const InvoiceSettings: React.FC<InvoiceSettingsProps> = ({
  language,
  currency,
  invoiceNumberPrefix,
  vatRate,
  vatEnabled,
  customTerms,
  onLanguageChange,
  onCurrencyChange,
  onInvoiceNumberPrefixChange,
  onVatRateChange,
  onVatEnabledChange,
  onCustomTermsChange
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Invoice Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Language</Label>
            <Select value={language} onValueChange={onLanguageChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Currency</Label>
            <Select value={currency} onValueChange={onCurrencyChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    {currency.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Invoice Number Prefix</Label>
            <Input
              value={invoiceNumberPrefix}
              onChange={(e) => onInvoiceNumberPrefixChange(e.target.value)}
              placeholder="RE NR:"
            />
          </div>

          <div>
            <Label>VAT Rate (%)</Label>
            <Input
              type="number"
              value={vatRate}
              onChange={(e) => onVatRateChange(parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            checked={vatEnabled}
            onCheckedChange={onVatEnabledChange}
          />
          <Label>Enable VAT</Label>
        </div>

        <div>
          <Label>Custom Terms</Label>
          <Textarea
            value={customTerms}
            onChange={(e) => onCustomTermsChange(e.target.value)}
            placeholder="We verzoeken dat de door ons gefactureerde diensten binnen 3 dagen worden gecrediteerd/overgemaakt. Alle belastingen en sociale premies worden door ons aangegeven en afgedragen aan de autoriteiten."
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );
};
