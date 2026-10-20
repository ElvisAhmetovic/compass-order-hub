import { describe, it, expect } from "vitest";
import { toVatFraction, getDefaultLineVatRate } from "../invoiceVat";

describe("invoice VAT defaults", () => {
  it("converts 19% to 0.19", () => {
    expect(toVatFraction(19)).toBe(0.19);
  });
  it("new line takes the template rate when VAT is on", () => {
    expect(getDefaultLineVatRate({ vatEnabled: true, vatRate: 19 })).toBe(0.19);
  });
  it("new line is 0% when VAT is off", () => {
    expect(getDefaultLineVatRate({ vatEnabled: false, vatRate: 19 })).toBe(0);
  });
  it("100 net at 19% gives 19 VAT and 119 total", () => {
    const rate = toVatFraction(19);
    const vat = Math.round(100 * rate * 100) / 100;
    expect(vat).toBe(19);
    expect(100 + vat).toBe(119);
  });
});
