
import { useState, useEffect } from "react";
import { getCompanyInfo, saveCompanyInfo } from "@/utils/proposal/companyInfo";
import { DEFAULT_COMPANY_LOGO } from "../constants";

export interface InvoiceSettings {
  logo: string;
  logoSize: string;
  language: string;
  selectedPaymentAccount: string;
  customTerms: string;
  vatEnabled: boolean;
  vatRate: number;
  currency: string;
  invoiceNumberPrefix: string;
  companyInfo: any;
}

export const useInvoiceSettings = (initialSettings?: any) => {
  const [isLoading, setIsLoading] = useState(true);

  const loadSavedSettings = () => {
    try {
      const saved = localStorage.getItem('invoiceTemplateSettings');
      if (saved) {
        const parsedSettings = JSON.parse(saved);
        if (!parsedSettings.logo) {
          parsedSettings.logo = DEFAULT_COMPANY_LOGO;
        }
        return parsedSettings;
      }
    } catch (error) {
      console.warn('Error loading saved settings:', error);
    }
    return {};
  };

  const initializeSettings = () => {
    const companyInfo = getCompanyInfo();
    const savedSettings = loadSavedSettings();
    
    const baseSettings = {
      logo: DEFAULT_COMPANY_LOGO,
      logoSize: "large",
      language: "en",
      selectedPaymentAccount: "belgium",
      customTerms: "",
      vatEnabled: true,
      vatRate: 21,
      currency: "EUR",
      invoiceNumberPrefix: "RE NR:",
    };

    const mergedCompanyInfo = {
      ...companyInfo,
      ...savedSettings.companyInfo,
      ...initialSettings?.companyInfo
    };

    return {
      ...baseSettings,
      ...savedSettings,
      ...initialSettings,
      companyInfo: mergedCompanyInfo
    };
  };

  const [settings, setSettings] = useState<InvoiceSettings>(initializeSettings);

  useEffect(() => {
    const timer = setTimeout(() => {
      const initializedSettings = initializeSettings();
      setSettings(initializedSettings);
      setIsLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const updateSettings = (newSettings: Partial<InvoiceSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const updateCompanyInfo = (field: string, value: string) => {
    const updatedCompanyInfo = { ...settings.companyInfo, [field]: value };
    setSettings(prev => ({ ...prev, companyInfo: updatedCompanyInfo }));
    saveCompanyInfo(updatedCompanyInfo);
  };

  useEffect(() => {
    if (isLoading) return;
    
    if (!settings.logo) {
      setSettings(prev => ({ ...prev, logo: DEFAULT_COMPANY_LOGO }));
    }
    
    if (!settings.companyInfo?.name || settings.companyInfo.name === "Company Name") {
      const freshCompanyInfo = getCompanyInfo();
      setSettings(prev => ({ 
        ...prev, 
        companyInfo: freshCompanyInfo 
      }));
    }
    
    try {
      localStorage.setItem('invoiceTemplateSettings', JSON.stringify(settings));
    } catch (error) {
      console.warn('Error saving settings to localStorage:', error);
    }
  }, [settings, isLoading]);

  return {
    settings,
    setSettings,
    updateSettings,
    updateCompanyInfo,
    isLoading
  };
};
