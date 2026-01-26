import { supabase } from "@/integrations/supabase/client";

export interface CompanySettings {
  id: string;
  user_id: string | null;
  logo: string | null;
  name: string;
  contact_person: string | null;
  street: string | null;
  postal: string | null;
  city: string | null;
  country: string | null;
  phone: string | null;
  fax: string | null;
  email: string | null;
  website: string | null;
  registration_number: string | null;
  vat_id: string | null;
  tax_number: string | null;
  director: string | null;
  wise: boolean;
  account_number: string | null;
  account_holder: string | null;
  payment_method: string | null;
  bank_code: string | null;
  iban: string | null;
  bic: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompanySettingsInput {
  logo?: string;
  name: string;
  contact_person?: string;
  street?: string;
  postal?: string;
  city?: string;
  country?: string;
  phone?: string;
  fax?: string;
  email?: string;
  website?: string;
  registration_number?: string;
  vat_id?: string;
  tax_number?: string;
  director?: string;
  wise?: boolean;
  account_number?: string;
  account_holder?: string;
  payment_method?: string;
  bank_code?: string;
  iban?: string;
  bic?: string;
}

// Default company info for fallback
const DEFAULT_COMPANY_INFO: CompanySettingsInput = {
  logo: "https://placehold.co/200x60?text=Your+Logo",
  name: "AB MEDIA TEAM",
  contact_person: "Andreas Berger",
  street: "Weseler Str.73",
  postal: "47169",
  city: "Duisburg",
  country: "Germany",
  phone: "+4920370907262",
  fax: "+49 203 70 90 73 53",
  email: "kontakt.abmedia@gmail.com",
  website: "www.abmedia-team.com",
  registration_number: "15748871",
  vat_id: "DE123418679",
  tax_number: "13426 27369",
  director: "Andreas Berger",
  wise: true,
  account_number: "12345678901234567",
  account_holder: "YOUR NAME",
  payment_method: "CREDIT CARD",
  bank_code: "967",
  iban: "BE79967023897833",
  bic: "TRWIBEB1"
};

export const companySettingsService = {
  async getSettings(): Promise<CompanySettingsInput> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user?.id) {
        return DEFAULT_COMPANY_INFO;
      }

      const { data, error } = await supabase
        .from("company_settings")
        .select("*")
        .eq("user_id", user.user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching company settings:", error);
        return DEFAULT_COMPANY_INFO;
      }

      if (!data) {
        return DEFAULT_COMPANY_INFO;
      }

      return {
        logo: data.logo || DEFAULT_COMPANY_INFO.logo,
        name: data.name,
        contact_person: data.contact_person || undefined,
        street: data.street || undefined,
        postal: data.postal || undefined,
        city: data.city || undefined,
        country: data.country || undefined,
        phone: data.phone || undefined,
        fax: data.fax || undefined,
        email: data.email || undefined,
        website: data.website || undefined,
        registration_number: data.registration_number || undefined,
        vat_id: data.vat_id || undefined,
        tax_number: data.tax_number || undefined,
        director: data.director || undefined,
        wise: data.wise || false,
        account_number: data.account_number || undefined,
        account_holder: data.account_holder || undefined,
        payment_method: data.payment_method || undefined,
        bank_code: data.bank_code || undefined,
        iban: data.iban || undefined,
        bic: data.bic || undefined
      };
    } catch (error) {
      console.error("Error in getSettings:", error);
      return DEFAULT_COMPANY_INFO;
    }
  },

  async saveSettings(settings: CompanySettingsInput): Promise<CompanySettings | null> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user?.id) {
        throw new Error("User not authenticated");
      }

      // Check if settings exist
      const { data: existing } = await supabase
        .from("company_settings")
        .select("id")
        .eq("user_id", user.user.id)
        .maybeSingle();

      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from("company_settings")
          .update(settings)
          .eq("user_id", user.user.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from("company_settings")
          .insert({
            ...settings,
            user_id: user.user.id
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error("Error saving company settings:", error);
      throw error;
    }
  }
};

// Legacy compatibility functions
export const getCompanyInfo = async () => {
  return companySettingsService.getSettings();
};

export const saveCompanyInfo = async (companyInfo: CompanySettingsInput) => {
  return companySettingsService.saveSettings(companyInfo);
};
