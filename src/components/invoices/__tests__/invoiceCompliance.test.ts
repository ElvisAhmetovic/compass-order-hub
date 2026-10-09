import { describe, it, expect } from "vitest";
import { DEFAULT_TERMS, isLegacyDefaultTerms, LEGACY_DEFAULT_TERMS } from "../constants";
import { getServiceDateLine } from "../invoiceCompliance";

const fmt = (d: string) => d.slice(0, 10);

describe("invoice compliance defaults", () => {
  it("default notes no longer contain the 3-day term or the tax claim", () => {
    for (const text of Object.values(DEFAULT_TERMS)) {
      expect(text).not.toMatch(/3 (Tagen|days)|Sozialabgaben|social contributions/);
    }
  });
  it("old saved default notes are recognised and replaced", () => {
    expect(isLegacyDefaultTerms(LEGACY_DEFAULT_TERMS.de)).toBe(true);
    expect(isLegacyDefaultTerms("My own custom text")).toBe(false);
  });
  it("service date falls back to the invoice date", () => {
    expect(getServiceDateLine("de", { issue_date: "2026-10-05" }, fmt)).toEqual({ label: "Leistungsdatum:", value: "2026-10-05" });
  });
  it("service period is shown when an end date is set", () => {
    expect(getServiceDateLine("de", { issue_date: "2026-10-05", service_date: "2026-10-01", service_period_end: "2026-10-05" }, fmt))
      .toEqual({ label: "Leistungszeitraum:", value: "2026-10-01 – 2026-10-05" });
  });
});
