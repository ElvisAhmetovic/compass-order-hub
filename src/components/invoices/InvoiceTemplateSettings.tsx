
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Upload, X } from "lucide-react";
import { getCompanyInfo, saveCompanyInfo } from "@/utils/proposal/companyInfo";

interface PaymentAccount {
  id: string;
  country: string;
  name: string;
  iban: string;
  bic: string;
  bank?: string;
  blz?: string;
  account?: string;
}

interface InvoiceTemplateSettingsProps {
  onSettingsChange: (settings: any) => void;
  initialSettings?: any;
}

const PAYMENT_ACCOUNTS: PaymentAccount[] = [
  {
    id: "belgium",
    country: "Belgium",
    name: "Bankrekening België",
    iban: "BE79967023897833",
    bic: "TRWIBEB1XXX",
    blz: "967",
    account: "967023897833"
  },
  {
    id: "germany", 
    country: "Germany",
    name: "German Bank Account",
    iban: "DE91240703680071572200",
    bic: "DEUTDE2HP22",
    bank: "Postbank/DSL Ndl of Deutsche Bank"
  }
];

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'de', name: 'Deutsch' },
  { code: 'nl', name: 'Nederlands' },
  { code: 'fr', name: 'Français' },
  { code: 'es', name: 'Español' },
  { code: 'da', name: 'Dansk' },
  { code: 'no', name: 'Norsk' },
  { code: 'cs', name: 'Čeština' },
  { code: 'pl', name: 'Polski' },
  { code: 'sv', name: 'Svenska' }
];

const CURRENCIES = [
  { code: 'EUR', name: 'EUR (€)', symbol: '€' },
  { code: 'USD', name: 'USD ($)', symbol: '$' },
  { code: 'GBP', name: 'GBP (£)', symbol: '£' },
  { code: 'JPY', name: 'JPY (¥)', symbol: '¥' },
  { code: 'CAD', name: 'CAD (C$)', symbol: 'C$' },
  { code: 'AUD', name: 'AUD (A$)', symbol: 'A$' },
  { code: 'CHF', name: 'CHF (₣)', symbol: '₣' },
  { code: 'SEK', name: 'SEK (kr)', symbol: 'kr' },
  { code: 'NOK', name: 'NOK (kr)', symbol: 'kr' },
  { code: 'DKK', name: 'DKK (kr)', symbol: 'kr' }
];

// Default company logo
const DEFAULT_COMPANY_LOGO = "/lovable-uploads/f7433a5f-4a36-45f5-a9c0-0609818523fe.png";

const InvoiceTemplateSettings: React.FC<InvoiceTemplateSettingsProps> = ({
  onSettingsChange,
  initialSettings
}) => {
  // Load saved settings from localStorage on component mount
  const loadSavedSettings = () => {
    try {
      const saved = localStorage.getItem('invoiceTemplateSettings');
      if (saved) {
        const parsedSettings = JSON.parse(saved);
        // If no logo is set, use the default company logo
        if (!parsedSettings.logo) {
          parsedSettings.logo = DEFAULT_COMPANY_LOGO;
        }
        return parsedSettings;
      }
    } catch (error) {
      console.log('No saved settings found');
    }
    return {};
  };

  const [settings, setSettings] = useState({
    logo: DEFAULT_COMPANY_LOGO, // Set default logo
    logoSize: "large",
    language: "en",
    selectedPaymentAccount: "belgium",
    companyInfo: {
      name: "AB MEDIA TEAM LTD",
      contactPerson: "Andreas Berger",
      street: "Weseler Str.73",
      postal: "47169",
      city: "Duisburg",
      country: "Germany",
      phone: "+49 203 70 90 72 62",
      email: "kontakt.abmedia@gmail.com",
      website: "www.abmedia-team.com",
      registrationNumber: "15748871",
      vatId: "DE123418679",
      taxNumber: "13426 27369",
      director: "Andreas Berger",
      ...getCompanyInfo()
    },
    customTerms: "",
    vatEnabled: true,
    vatRate: 21,
    currency: "EUR",
    invoiceNumberPrefix: "RE NR:",
    ...loadSavedSettings(),
    ...initialSettings
  });

  useEffect(() => {
    // Ensure the default logo is always set if no logo exists
    if (!settings.logo) {
      setSettings(prev => ({ ...prev, logo: DEFAULT_COMPANY_LOGO }));
    }
    
    onSettingsChange(settings);
    // Save settings to localStorage whenever they change
    localStorage.setItem('invoiceTemplateSettings', JSON.stringify(settings));
  }, [settings, onSettingsChange]);

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const logoUrl = e.target?.result as string;
        setSettings(prev => ({ ...prev, logo: logoUrl }));
      };
      reader.readAsDataURL(file);
    }
  };

  const resetToDefaultLogo = () => {
    setSettings(prev => ({ ...prev, logo: DEFAULT_COMPANY_LOGO }));
  };

  const updateCompanyInfo = (field: string, value: string) => {
    const updatedCompanyInfo = { ...settings.companyInfo, [field]: value };
    setSettings(prev => ({ ...prev, companyInfo: updatedCompanyInfo }));
    saveCompanyInfo(updatedCompanyInfo);
  };

  const selectedAccount = PAYMENT_ACCOUNTS.find(acc => acc.id === settings.selectedPaymentAccount);

  // Get translated payment labels
  const getPaymentTranslations = (language: string) => {
    const translations = {
      en: {
        paymentAccount: "Payment Account",
        iban: "IBAN",
        bic: "BIC", 
        blz: "BLZ",
        account: "Account",
        bank: "Bank"
      },
      nl: {
        paymentAccount: "Betaalrekening",
        iban: "IBAN",
        bic: "BIC",
        blz: "BLZ", 
        account: "Rekening",
        bank: "Bank"
      },
      de: {
        paymentAccount: "Zahlungskonto",
        iban: "IBAN",
        bic: "BIC",
        blz: "BLZ",
        account: "Konto",
        bank: "Bank"
      },
      fr: {
        paymentAccount: "Compte de paiement",
        iban: "IBAN",
        bic: "BIC",
        blz: "BLZ",
        account: "Compte",
        bank: "Banque"
      },
      es: {
        paymentAccount: "Cuenta de pago",
        iban: "IBAN",
        bic: "BIC",
        blz: "BLZ",
        account: "Cuenta",
        bank: "Banco"
      },
      da: {
        paymentAccount: "Betalingskonto",
        iban: "IBAN",
        bic: "BIC",
        blz: "BLZ",
        account: "Konto",
        bank: "Bank"
      },
      no: {
        paymentAccount: "Betalingskonto",
        iban: "IBAN",
        bic: "BIC",
        blz: "BLZ",
        account: "Konto",
        bank: "Bank"
      },
      cs: {
        paymentAccount: "Platební účet",
        iban: "IBAN",
        bic: "BIC",
        blz: "BLZ",
        account: "Účet",
        bank: "Banka"
      },
      pl: {
        paymentAccount: "Konto płatnicze",
        iban: "IBAN",
        bic: "BIC",
        blz: "BLZ",
        account: "Konto",
        bank: "Bank"
      },
      sv: {
        paymentAccount: "Betalningskonto",
        iban: "IBAN",
        bic: "BIC",
        blz: "BLZ",
        account: "Konto",
        bank: "Bank"
      }
    };
    
    return translations[language] || translations.en;
  };

  const paymentLabels = getPaymentTranslations(settings.language);

  return (
    <div className="space-y-6">
      {/* Company Logo */}
      <Card>
        <CardHeader>
          <CardTitle>Company Logo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            {settings.logo && (
              <div className="relative">
                <img 
                  src={settings.logo} 
                  alt="Company Logo" 
                  className={`${
                    settings.logoSize === "small" ? "h-12" :
                    settings.logoSize === "medium" ? "h-16" :
                    "h-24"
                  } w-auto object-contain`}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6"
                  onClick={() => setSettings(prev => ({ ...prev, logo: "" }))}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="logo-upload">Upload Custom Logo</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('logo-upload')?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Choose File
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetToDefaultLogo}
                >
                  Reset to Default
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                AB Media Team logo is set as default. Upload a custom logo or use the default.
              </p>
            </div>
          </div>
          
          <div>
            <Label>Logo Size</Label>
            <Select value={settings.logoSize} onValueChange={(value) => setSettings(prev => ({ ...prev, logoSize: value }))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Small</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="large">Large</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Company Information */}
      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Company Name</Label>
              <Input
                value={settings.companyInfo.name}
                onChange={(e) => updateCompanyInfo('name', e.target.value)}
              />
            </div>
            <div>
              <Label>Contact Person</Label>
              <Input
                value={settings.companyInfo.contactPerson}
                onChange={(e) => updateCompanyInfo('contactPerson', e.target.value)}
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                value={settings.companyInfo.email}
                onChange={(e) => updateCompanyInfo('email', e.target.value)}
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                value={settings.companyInfo.phone}
                onChange={(e) => updateCompanyInfo('phone', e.target.value)}
              />
            </div>
            <div>
              <Label>Registration Number</Label>
              <Input
                value={settings.companyInfo.registrationNumber}
                onChange={(e) => updateCompanyInfo('registrationNumber', e.target.value)}
              />
            </div>
            <div>
              <Label>VAT ID</Label>
              <Input
                value={settings.companyInfo.vatId}
                onChange={(e) => updateCompanyInfo('vatId', e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <Label>Address</Label>
            <Textarea
              value={`${settings.companyInfo.street}\n${settings.companyInfo.postal} ${settings.companyInfo.city}\n${settings.companyInfo.country}`}
              onChange={(e) => {
                const lines = e.target.value.split('\n');
                updateCompanyInfo('street', lines[0] || '');
                const cityLine = lines[1] || '';
                const [postal, ...cityParts] = cityLine.split(' ');
                updateCompanyInfo('postal', postal || '');
                updateCompanyInfo('city', cityParts.join(' ') || '');
                updateCompanyInfo('country', lines[2] || '');
              }}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Payment Information */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>{paymentLabels.paymentAccount}</Label>
            <Select 
              value={settings.selectedPaymentAccount} 
              onValueChange={(value) => setSettings(prev => ({ ...prev, selectedPaymentAccount: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_ACCOUNTS.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{account.country}</Badge>
                      {account.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedAccount && (
            <div className="p-4 bg-gray-50 rounded-lg space-y-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>{paymentLabels.iban}:</strong> {selectedAccount.iban}
                </div>
                <div>
                  <strong>{paymentLabels.bic}:</strong> {selectedAccount.bic}
                </div>
                {selectedAccount.blz && (
                  <div>
                    <strong>{paymentLabels.blz}:</strong> {selectedAccount.blz}
                  </div>
                )}
                {selectedAccount.account && (
                  <div>
                    <strong>{paymentLabels.account}:</strong> {selectedAccount.account}
                  </div>
                )}
                {selectedAccount.bank && (
                  <div className="col-span-2">
                    <strong>{paymentLabels.bank}:</strong> {selectedAccount.bank}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Language</Label>
              <Select value={settings.language} onValueChange={(value) => setSettings(prev => ({ ...prev, language: value }))}>
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
              <Select value={settings.currency} onValueChange={(value) => setSettings(prev => ({ ...prev, currency: value }))}>
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
                value={settings.invoiceNumberPrefix}
                onChange={(e) => setSettings(prev => ({ ...prev, invoiceNumberPrefix: e.target.value }))}
                placeholder="RE NR:"
              />
            </div>

            <div>
              <Label>VAT Rate (%)</Label>
              <Input
                type="number"
                value={settings.vatRate}
                onChange={(e) => setSettings(prev => ({ ...prev, vatRate: parseFloat(e.target.value) || 0 }))}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={settings.vatEnabled}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, vatEnabled: checked }))}
            />
            <Label>Enable VAT</Label>
          </div>

          <div>
            <Label>Custom Terms</Label>
            <Textarea
              value={settings.customTerms}
              onChange={(e) => setSettings(prev => ({ ...prev, customTerms: e.target.value }))}
              placeholder="We verzoeken dat de door ons gefactureerde diensten binnen 3 dagen worden gecrediteerd/overgemaakt. Alle belastingen en sociale premies worden door ons aangegeven en afgedragen aan de autoriteiten."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const logoUrl = e.target?.result as string;
      setSettings(prev => ({ ...prev, logo: logoUrl }));
    };
    reader.readAsDataURL(file);
  }
};

const resetToDefaultLogo = () => {
  setSettings(prev => ({ ...prev, logo: DEFAULT_COMPANY_LOGO }));
};

export default InvoiceTemplateSettings;
