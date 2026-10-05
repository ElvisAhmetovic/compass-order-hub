// Public contact and legal details shown on the Empria Tech marketing site only.
// The CRM, client portal, proposals and PDFs keep their own company settings and are unaffected by this file.
// Empty values stay hidden on the pages that read them.
import type { HomepageLanguage } from "@/content/homepage";

export const contactInfo = {
  email: "kontakt@empriatech.com",
  legalName: "AB TEAM LTD",
  phone: "+49 203 70907262",
  address: {
    de: "Weseler Str. 73, 47169 Duisburg, Deutschland",
    en: "Weseler Str. 73, 47169 Duisburg, Germany",
  } as Record<HomepageLanguage, string>,
  social: [] as { label: string; url: string }[],
};

// The street and postal code are identical in both languages; only the country name changes.
export const publicAddress = (language: HomepageLanguage) => contactInfo.address[language];
