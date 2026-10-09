import { describe, it, expect } from "vitest";
import { PAYMENT_ACCOUNTS, filterAccountsByChoice } from "../constants";

const ids = (choice?: string) => filterAccountsByChoice(PAYMENT_ACCOUNTS, choice).map((a) => a.id);

describe("payment account choice", () => {
  it("German only shows just the German account", () => expect(ids("germany_only")).toEqual(["germany"]));
  it("Revolut only shows just the Revolut account", () => expect(ids("revolut_only")).toEqual(["revolut"]));
  it("Both shows both accounts", () => expect(ids("all")).toEqual(["germany", "revolut"]));
  it("old saved 'germany' value shows both", () => expect(ids("germany")).toEqual(["germany", "revolut"]));
});
