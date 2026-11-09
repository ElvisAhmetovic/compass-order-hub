import { describe, it, expect } from "vitest";
import { grossAmount } from "../orderStripeLinkMath";

describe("order Stripe link total", () => {
  it("€399,99 + 19% VAT = €475,99", () => expect(grossAmount(399.99, true, 19)).toBe(475.99));
  it("VAT off = net", () => expect(grossAmount(399.99, false, 19)).toBe(399.99));
});
