
import React, { useEffect } from "react";
import { LogoSettings } from "./components/LogoSettings";
import { CompanyInformation } from "./components/CompanyInformation";
import { PaymentInformation } from "./components/PaymentInformation";
import { InvoiceSettings } from "./components/InvoiceSettings";
import { useInvoiceSettings } from "./hooks/useInvoiceSettings";

interface InvoiceTemplateSettingsProps {
  onSettingsChange: (settings: any) => void;
  initialSettings?: any;
}

const InvoiceTemplateSettings: React.FC<InvoiceTemplateSettingsProps> = ({
  onSettingsChange,
  initialSettings
}) => {
  const {
    settings,
    updateSettings,
    updateCompanyInfo,
    isLoading
  } = useInvoiceSettings(initialSettings);

  useEffect(() => {
    if (!isLoading) {
      onSettingsChange(settings);
    }
  }, [settings, onSettingsChange, isLoading]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <LogoSettings
        logo={settings.logo}
        logoSize={settings.logoSize}
        onLogoChange={(logo) => updateSettings({ logo })}
        onLogoSizeChange={(logoSize) => updateSettings({ logoSize })}
      />

      <CompanyInformation
        companyInfo={settings.companyInfo}
        onUpdateCompanyInfo={updateCompanyInfo}
      />

      <PaymentInformation
        selectedPaymentAccount={settings.selectedPaymentAccount}
        language={settings.language}
        onPaymentAccountChange={(selectedPaymentAccount) => updateSettings({ selectedPaymentAccount })}
      />

      <InvoiceSettings
        language={settings.language}
        currency={settings.currency}
        invoiceNumberPrefix={settings.invoiceNumberPrefix}
        vatRate={settings.vatRate}
        vatEnabled={settings.vatEnabled}
        customTerms={settings.customTerms}
        onLanguageChange={(language) => updateSettings({ language })}
        onCurrencyChange={(currency) => updateSettings({ currency })}
        onInvoiceNumberPrefixChange={(invoiceNumberPrefix) => updateSettings({ invoiceNumberPrefix })}
        onVatRateChange={(vatRate) => updateSettings({ vatRate })}
        onVatEnabledChange={(vatEnabled) => updateSettings({ vatEnabled })}
        onCustomTermsChange={(customTerms) => updateSettings({ customTerms })}
      />
    </div>
  );
};

export default InvoiceTemplateSettings;
