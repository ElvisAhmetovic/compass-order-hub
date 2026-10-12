import { describe, it, expect } from "vitest";
import { normalizeTemplateSettings } from "../loadTemplateSettings";
import { DEFAULT_COMPANY_LOGO, LEGACY_COMPANY_LOGOS, LEGACY_DEFAULT_TERMS } from "../constants";

describe("normalizeTemplateSettings", () => {
  const stale = {
    logo: LEGACY_COMPANY_LOGOS[1],
    customTerms: Object.values(LEGACY_DEFAULT_TERMS)[0],
    selectedPaymentAccount: "all",
    companyInfo: { name: "AB MEDIA TEAM LTD", email: "kontakt.abmedia@gmail.com" },
  };
  const dbInfo = { name: "Media Marketing Limited", email: "" };

  it("replaces the old logo with the new default", () => {
    expect(normalizeTemplateSettings(stale, dbInfo).logo).toBe(DEFAULT_COMPANY_LOGO);
  });
  it("keeps an uploaded logo", () => {
    expect(normalizeTemplateSettings({ logo: "data:image/png;base64,x" }, dbInfo).logo).toBe("data:image/png;base64,x");
  });
  it("uses shared company info, not the browser copy", () => {
    expect(normalizeTemplateSettings(stale, dbInfo).companyInfo.name).toBe("Media Marketing Limited");
  });
  it("resets the old default note", () => {
    expect(normalizeTemplateSettings(stale, dbInfo).customTerms).toBe("");
  });
  it("maps the old 'all' account choice to an id list", () => {
    expect(Array.isArray(normalizeTemplateSettings(stale, dbInfo).selectedPaymentAccount)).toBe(true);
  });
  it("defaults to German and Revolut", () => {
    expect(normalizeTemplateSettings({}, dbInfo).selectedPaymentAccount).toEqual(["germany", "revolut"]);
  });

  it("cleans the screenshot case: old contact, UID, Gmail and magnifier logo", () => {
    const r = normalizeTemplateSettings(
      {
        logo: "https://www.empriatech.com/lovable-uploads/2d4259f4-7fb1-4221-9e23-4bec4378d055.png",
        companyInfo: { contactPerson: "Andreas Berger", vatId: "13426 27369", email: "kontakt.abmedia@gmail.com" },
      },
      { name: "Media Marketing Limited", contactPerson: "Annalena Klein", vatId: "", email: "" },
    );
    expect(r.logo).toBe(DEFAULT_COMPANY_LOGO);
    expect(r.companyInfo.contactPerson).toBe("Annalena Klein");
    expect(r.companyInfo.vatId).toBe("");
    expect(r.companyInfo.email).toBe("");
  });
});
