import { loadCompanyInfo, getCompanyInfo } from "@/utils/proposal/companyInfo";
import {
  DEFAULT_COMPANY_LOGO,
  isLegacyLogo,
  normalizePaymentAccountIds,
  isLegacyDefaultTerms,
} from "./constants";

const STORAGE_KEY = "invoiceTemplateSettings";

export const BASE_TEMPLATE_SETTINGS = {
  logo: DEFAULT_COMPANY_LOGO,
  logoSize: "large",
  language: "en",
  selectedPaymentAccount: ["germany", "revolut"],
  customTerms: "",
  vatEnabled: true,
  vatRate: 0,
  currency: "EUR",
  invoiceNumberPrefix: "INV-",
  reverseCharge: false,
};

const readStored = (): Record<string, any> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

/** Brings possibly stale browser-saved settings up to the current template. Company info always comes from the shared settings. */
export const normalizeTemplateSettings = (stored: Record<string, any> = {}, companyInfo: any = getCompanyInfo()) => {
  const merged = { ...BASE_TEMPLATE_SETTINGS, ...stored };
  return {
    ...merged,
    logo: !merged.logo || isLegacyLogo(merged.logo) ? DEFAULT_COMPANY_LOGO : merged.logo,
    selectedPaymentAccount: normalizePaymentAccountIds(merged.selectedPaymentAccount),
    customTerms: isLegacyDefaultTerms(merged.customTerms) ? "" : merged.customTerms || "",
    reverseCharge: merged.reverseCharge === true,
    companyInfo: { ...companyInfo },
  };
};

export const getInvoiceTemplateSettingsSync = () => normalizeTemplateSettings(readStored());

export const loadInvoiceTemplateSettings = async () => {
  const info = await loadCompanyInfo();
  return normalizeTemplateSettings(readStored(), info);
};
