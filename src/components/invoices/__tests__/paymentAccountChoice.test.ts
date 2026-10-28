import { describe, it, expect } from "vitest";
import { PAYMENT_ACCOUNTS, filterAccountsByChoice } from "../constants";

const ids = (choice?: unknown) => filterAccountsByChoice(PAYMENT_ACCOUNTS, choice).map((a) => a.id);

describe("payment account selection", () => {
  it("default is German + Revolut", () => expect(ids(undefined)).toEqual(["germany", "revolut"]));
  it("Wise alone", () => expect(ids(["wise"])).toEqual(["wise"]));
  it("all three", () => expect(ids(["wise", "germany", "revolut"])).toEqual(["germany", "wise", "revolut"]));
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
    expect(OPTS.map((o) => o.label)).toEqual(["German Bank Account (Media Marketing)", "MEDIA MARKETING WISE", "MEDIA MARKETING PAYONEER", "MEDIA MARKETING WISE UK", "WEBS WORKERS LTD REVOLUT"]);
  });
});

describe("Wise UK account", () => {
  it("prints GB83 TRWI 6084 6467 2787 39 / TRWIGB2LXXX and is not a default", () => {
    expect(pick(ALL, ["wiseUk"]).map((a) => [a.iban, a.bic, a.sortCode, a.accountNumber])).toEqual([["GB83 TRWI 6084 6467 2787 39", "TRWIGB2LXXX", "60-84-64", "67278739"]]);
    expect(norm(undefined)).not.toContain("wiseUk");
    expect([...MONTHLY_PAYMENT_ACCOUNT_IDS]).not.toContain("wiseUk");
  });
});
