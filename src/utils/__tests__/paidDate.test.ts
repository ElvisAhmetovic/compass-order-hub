import { describe, it, expect } from "vitest";
import { paidDateLabel } from "../paidDate";

describe("paidDateLabel", () => {
  it("shows the paid date for paid invoices", () => {
    expect(paidDateLabel("paid", "2026-10-27T10:05:00Z")).toBe("Paid 27.10.2026");
  });
  it("shows nothing for unpaid invoices", () => {
    expect(paidDateLabel("sent", "2026-10-27T10:05:00Z")).toBeNull();
  });
});
