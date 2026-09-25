
import { useState, useEffect, useRef, useCallback } from "react";
import { getCompanyInfo, saveCompanyInfo, loadCompanyInfo } from "@/utils/proposal/companyInfo";
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

export type CompanySaveStatus = "idle" | "saving" | "saved" | "error";

export const useInvoiceSettings = (initialSettings?: any) => {
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<CompanySaveStatus>("idle");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadSavedSettings = () => {
    try {
      const saved = localStorage.getItem('invoiceTemplateSettings');
      if (saved) {
        const parsedSettings = JSON.parse(saved);
        if (!parsedSettings.logo) parsedSettings.logo = DEFAULT_COMPANY_LOGO;
        return parsedSettings;
      }
    } catch (error) {
      console.warn('Error loading saved settings:', error);
    }
    return {};
  };

  const initializeSettings = (companyInfo: any = getCompanyInfo()) => {
    const savedSettings = loadSavedSettings();
    const baseSettings = {
      logo: DEFAULT_COMPANY_LOGO,
      logoSize: "large",
      language: "en",
      selectedPaymentAccount: "both",
      customTerms: "",
      vatEnabled: true,
      vatRate: 0,
      currency: "EUR",
      invoiceNumberPrefix: "INV-",
    };
    return {
      ...baseSettings,
      ...savedSettings,
      ...initialSettings,
      // Database company info is the source of truth
      companyInfo: { ...companyInfo },
    };
  };

  const [settings, setSettings] = useState<InvoiceSettings>(() => initializeSettings());

  useEffect(() => {
    let cancelled = false;
    loadCompanyInfo()
      .then((info) => {
        if (!cancelled) setSettings(initializeSettings(info));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateSettings = (newSettings: Partial<InvoiceSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const scheduleSave = useCallback((info: any) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaveStatus("saving");
    saveTimer.current = setTimeout(async () => {
      try {
        await saveCompanyInfo(info);
        setSaveStatus("saved");
      } catch {
        setSaveStatus("error");
      }
    }, 1000);
  }, []);

  const updateCompanyInfo = (field: string, value: string) => {
    setSettings(prev => {
      const companyInfo = { ...prev.companyInfo, [field]: value };
      scheduleSave(companyInfo);
      return { ...prev, companyInfo };
    });
  };

  useEffect(() => {
    if (isLoading) return;
    if (!settings.logo) {
      setSettings(prev => ({ ...prev, logo: DEFAULT_COMPANY_LOGO }));
    }
    try {
      localStorage.setItem('invoiceTemplateSettings', JSON.stringify(settings));
    } catch (error) {
      console.warn('Error saving settings to localStorage:', error);
    }
  }, [settings, isLoading]);

  return { settings, setSettings, updateSettings, updateCompanyInfo, isLoading, saveStatus };
};
