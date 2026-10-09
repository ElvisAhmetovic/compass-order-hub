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
