import { describe, it, expect } from "vitest";
import { isValidPaymentLink, stripeButtonHtml } from "../stripePaymentLink";

describe("Stripe payment link", () => {
  it("accepts https links", () => {
    expect(isValidPaymentLink("https://buy.stripe.com/abc123")).toBe(true);
  });
  it("rejects http links", () => {
    expect(isValidPaymentLink("http://buy.stripe.com/abc")).toBe(false);
  });
  it("rejects javascript links", () => {
    expect(isValidPaymentLink("javascript:alert(1)")).toBe(false);
  });
  it("rejects empty values", () => {
    expect(isValidPaymentLink("")).toBe(false);
  });
  it("shows no button without a valid link", () => {
    expect(stripeButtonHtml("", "en")).toBe("");
  });
});
