// Public contact and legal details shown on the Empria Tech marketing site only.
// The CRM, client portal, proposals and PDFs keep their own company settings and are unaffected by this file.
// Empty values stay hidden on the pages that read them.
import type { HomepageLanguage } from "@/content/homepage";

export const contactInfo = {
  email: "kontakt@empriatech.com",
  legalName: "MEDIA MARKETING LTD",
  companyNumber: "17507679",
  phone: "+49 203 7090 1754",
  address: {
    de: "Monomark House, 27 Old Gloucester Street, London, England, WC1N 3AX",
    en: "Monomark House, 27 Old Gloucester Street, London, England, WC1N 3AX",
  } as Record<HomepageLanguage, string>,
  social: [] as { label: string; url: string }[],
};

export const publicAddress = (language: HomepageLanguage) => contactInfo.address[language];
