import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(
  resolve(__dirname, "../../../../supabase/functions/generate-monthly-installments/index.ts"),
  "utf-8",
);
const bankBlock = source.slice(source.indexOf("const BANK_ACCOUNTS = ["), source.indexOf("];", source.indexOf("const BANK_ACCOUNTS = [")));

describe("automatic monthly invoices", () => {
  it("list the German bank account", () => {
    expect(bankBlock).toContain("DE91240703680071572200");
  });
  it("list the Revolut account", () => {
    expect(bankBlock).toContain("GB40REVO23012083344414");
  });
  it("never list the Wise account", () => {
    expect(bankBlock).not.toContain("BE75903030215751");
  });
  it("no longer promise payment within 3 days", () => {
    expect(source).not.toMatch(/within 3 days|innerhalb von 3 Tagen/);
  });
});

import { MONTHLY_PAYMENT_ACCOUNT_IDS, filterAccountsByChoice } from "../constants";

describe("manually sent monthly invoices", () => {
  it("show German and Revolut only, even when Wise is ticked in settings", () => {
    const accounts = [{ id: "germany" }, { id: "revolut" }, { id: "wise" }];
    const ids = filterAccountsByChoice(accounts, [...MONTHLY_PAYMENT_ACCOUNT_IDS]).map((a) => a.id);
    expect(ids).toEqual(["germany", "revolut"]);
  });
});
