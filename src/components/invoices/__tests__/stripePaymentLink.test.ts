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

import { getStripeEmailCopy, withStripeHint } from "../stripePaymentLink";
describe("Stripe email copy", () => {
  it("uses German button text for de", () => {
    expect(getStripeEmailCopy("de").label).toBe("Jetzt online bezahlen mit Stripe");
  });
  it("uses English button text for en", () => {
    expect(getStripeEmailCopy("en").label).toBe("Pay online with Stripe");
  });
  it("adds the hint only when a link exists", () => {
    expect(withStripeHint("Hello", "", "en")).toBe("Hello");
    expect(withStripeHint("Hello", "https://buy.stripe.com/x", "en")).toContain("button below");
  });
});
