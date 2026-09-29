import { describe, it, expect } from "vitest";
import { computeDueDate } from "../monthlyDueDate";
describe("computeDueDate", () => {
  it("is issue + 7 days when installment due is in the past", () => {
    expect(computeDueDate("2026-09-29", "2026-09-15")).toBe("2026-10-06");
  });
  it("keeps a later installment due date", () => {
    expect(computeDueDate("2026-09-01", "2026-09-15")).toBe("2026-09-15");
  });
  it("never earlier than issue date", () => {
    expect(computeDueDate("2026-12-28", null) > "2026-12-28").toBe(true);
  });
});
