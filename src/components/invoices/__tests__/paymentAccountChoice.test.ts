import { describe, it, expect } from "vitest";
import { PAYMENT_ACCOUNTS, filterAccountsByChoice } from "../constants";

const ids = (choice?: unknown) => filterAccountsByChoice(PAYMENT_ACCOUNTS, choice).map((a) => a.id);

describe("payment account selection", () => {
  it("default is German + Revolut", () => expect(ids(undefined)).toEqual(["germany", "revolut"]));
  it("Wise alone", () => expect(ids(["wise"])).toEqual(["wise"]));
  it("all three", () => expect(ids(["wise", "germany", "revolut"])).toEqual(["germany", "revolut", "wise"]));
  it("empty selection falls back to German + Revolut", () => expect(ids([])).toEqual(["germany", "revolut"]));
  it("old 'revolut_only' value", () => expect(ids("revolut_only")).toEqual(["revolut"]));
  it("old 'all' value", () => expect(ids("all")).toEqual(["germany", "revolut"]));
});

import { PAYMENT_ACCOUNTS as ALL, PAYMENT_ACCOUNT_OPTIONS as OPTS, MONTHLY_PAYMENT_ACCOUNT_IDS, normalizePaymentAccountIds as norm, filterAccountsByChoice as pick } from "../constants";
describe("Payoneer account", () => {
  it("can be ticked and shows its IBAN", () => {
    expect(pick(ALL, ["payoneer"]).map((a) => a.iban)).toEqual(["LU574080000049188578"]);
  });
  it("is not ticked by default", () => {
    expect(norm(undefined)).not.toContain("payoneer");
  });
  it("is never on monthly invoices", () => {
    expect([...MONTHLY_PAYMENT_ACCOUNT_IDS]).not.toContain("payoneer");
  });
  it("uses the owner names from the list as tick-box labels", () => {
    expect(OPTS.map((o) => o.label)).toEqual(["German Bank Account (Media Marketing LTD)", "MEDIA MARKETING LIMITED WISE", "MEDIA MARKETING LIMITED PAYONEER", "WEBS WORKERS LTD REVOLUT"]);
  });
});
