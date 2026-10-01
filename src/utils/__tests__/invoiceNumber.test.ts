import { describe, expect, it } from "vitest";
import { formatInvoiceNumber } from "../invoiceNumber";

describe("formatInvoiceNumber", () => {
  it("does not duplicate the default prefix already stored in the number", () => {
    expect(formatInvoiceNumber("INV-2026-1556", "INV-")).toBe("INV-2026-1556");
  });

  it("adds the configured prefix when the number does not contain it", () => {
    expect(formatInvoiceNumber("2026-1556", "INV-")).toBe("INV-2026-1556");
  });

  it("keeps the stored number when the prefix is empty", () => {
    expect(formatInvoiceNumber("INV-2026-1556", "")).toBe("INV-2026-1556");
  });

  it("preserves a genuinely different custom prefix", () => {
    expect(formatInvoiceNumber("INV-2026-1556", "AB-")).toBe("AB-INV-2026-1556");
  });
});