import { companySettingsService, CompanySettingsInput } from "@/services/companySettingsService";

// Default company info for synchronous fallback
const DEFAULT_COMPANY_INFO = {
  logo: "https://placehold.co/200x60?text=Your+Logo",
  name: "Media Marketing Limited",
  contactPerson: "Annalena Klein",
  street: "Düsseldorfer Str. 32",
  postal: "47051",
  city: "Duisburg",
  country: "Germany",
  phone: "+4920370907262",
  fax: "",
  email: "",
  website: "https://www.abm-team.com",
  registrationNumber: "17507679",
  vatId: "",
  taxNumber: "",
  director: "Annalena Klein",
  wise: true,
  accountNumber: undefined,
  accountHolder: "YOUR NAME",
  paymentMethod: "CREDIT CARD",
  bankCode: undefined,
  iban: "DE91240703680071572200",
  bic: "DEUTDE2HP22"
};

// Cache for company info to avoid repeated async calls
let cachedCompanyInfo: typeof DEFAULT_COMPANY_INFO | null = null;

// Async function to load company info from Supabase
export const loadCompanyInfo = async () => {
  try {
    const settings = await companySettingsService.getSettings();
    cachedCompanyInfo = {
      logo: settings.logo || DEFAULT_COMPANY_INFO.logo,
      name: settings.name,
      contactPerson: settings.contact_person || DEFAULT_COMPANY_INFO.contactPerson,
      street: settings.street || DEFAULT_COMPANY_INFO.street,
      postal: settings.postal || DEFAULT_COMPANY_INFO.postal,
      city: settings.city || DEFAULT_COMPANY_INFO.city,
      country: settings.country || DEFAULT_COMPANY_INFO.country,
      phone: settings.phone || DEFAULT_COMPANY_INFO.phone,
      fax: settings.fax || DEFAULT_COMPANY_INFO.fax,
      email: settings.email || DEFAULT_COMPANY_INFO.email,
      website: settings.website || DEFAULT_COMPANY_INFO.website,
      registrationNumber: settings.registration_number || DEFAULT_COMPANY_INFO.registrationNumber,
      vatId: settings.vat_id || DEFAULT_COMPANY_INFO.vatId,
      taxNumber: settings.tax_number || DEFAULT_COMPANY_INFO.taxNumber,
      director: settings.director || DEFAULT_COMPANY_INFO.director,
      wise: settings.wise ?? DEFAULT_COMPANY_INFO.wise,
      accountNumber: settings.account_number || DEFAULT_COMPANY_INFO.accountNumber,
      accountHolder: settings.account_holder || DEFAULT_COMPANY_INFO.accountHolder,
      paymentMethod: settings.payment_method || DEFAULT_COMPANY_INFO.paymentMethod,
      bankCode: settings.bank_code || DEFAULT_COMPANY_INFO.bankCode,
      iban: settings.iban || DEFAULT_COMPANY_INFO.iban,
      bic: settings.bic || DEFAULT_COMPANY_INFO.bic
    };
    return cachedCompanyInfo;
  } catch (error) {
    console.error("Error loading company info:", error);
    return DEFAULT_COMPANY_INFO;
  }
};

// Synchronous function that returns cached data or defaults
export const getCompanyInfo = () => {
  return cachedCompanyInfo || DEFAULT_COMPANY_INFO;
};

// Async function to save company info to Supabase
export const saveCompanyInfo = async (companyInfo: typeof DEFAULT_COMPANY_INFO) => {
  try {
    const settings: CompanySettingsInput = {
      logo: companyInfo.logo,
      name: companyInfo.name,
      contact_person: companyInfo.contactPerson,
      street: companyInfo.street,
      postal: companyInfo.postal,
      city: companyInfo.city,
      country: companyInfo.country,
      phone: companyInfo.phone,
      fax: companyInfo.fax,
      email: companyInfo.email,
      website: companyInfo.website,
      registration_number: companyInfo.registrationNumber,
      vat_id: companyInfo.vatId,
      tax_number: companyInfo.taxNumber,
      director: companyInfo.director,
      wise: companyInfo.wise,
      account_number: companyInfo.accountNumber,
      account_holder: companyInfo.accountHolder,
      payment_method: companyInfo.paymentMethod,
      bank_code: companyInfo.bankCode,
      iban: companyInfo.iban,
      bic: companyInfo.bic
    };
    
    await companySettingsService.saveSettings(settings);
    cachedCompanyInfo = companyInfo;
  } catch (error) {
    console.error("Error saving company info:", error);
    throw error;
  }
};
