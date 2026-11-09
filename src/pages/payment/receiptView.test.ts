import { describe, it, expect } from "vitest";
import { nextSteps, receiptState, type Receipt } from "./receiptView";

const base: Receipt = { kind: "order", title: "Website", amount: 399.99, currency: "EUR", paid: true, date: "2026-11-09", reference: "ABC", invoice_number: null, receipt_url: null, next_charge: null };
const o = { loading: false, notFound: false, failed: false, gaveUp: false };

describe("receipt page", () => {
  it("paid session shows paid", () => expect(receiptState(base, o)).toBe("paid"));
  it("unpaid session shows confirming while polling", () => expect(receiptState({ ...base, paid: false }, o)).toBe("confirming"));
  it("unpaid after polling gives up is not shown as paid", () => expect(receiptState({ ...base, paid: false }, { ...o, gaveUp: true })).toBe("notFound"));
  it("unknown link shows not found", () => expect(receiptState(null, { ...o, notFound: true })).toBe("notFound"));
  it("order next steps mention the team", () => expect(nextSteps(base)).toEqual(["email", "orderTeam", "contact"]));
  it("package with next charge shows the date step", () => expect(nextSteps({ ...base, kind: "package", next_charge: "2026-12-09" })).toEqual(["email", "packageNext", "contact"]));
});
