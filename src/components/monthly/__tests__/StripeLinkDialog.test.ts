import { describe, it, expect } from "vitest";
import { validateProductName, defaultProductName } from "../StripeLinkDialog";

describe("Stripe link product name", () => {
  it("empty name is blocked", () => {
    expect(validateProductName("   ")).toBe("Product name is required");
  });
  it("normal name passes", () => {
    expect(validateProductName("SEO Paket Premium")).toBeNull();
  });
  it("over 120 characters is blocked", () => {
    expect(validateProductName("x".repeat(121))).toBe("Max 120 characters");
  });
  it("default is client – website", () => {
    expect(defaultProductName("ACME", "acme.de")).toBe("ACME – acme.de");
    expect(defaultProductName("ACME", null)).toBe("ACME – Paket");
  });
});
