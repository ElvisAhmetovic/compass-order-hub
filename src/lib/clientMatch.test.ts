import { describe, it, expect } from "vitest";
import { matchClientByEmail } from "./clientMatch";

const clients = [{ id: "1", email: "Anna@Praxis.de" }, { id: "2", email: "b@x.com" }];
describe("matchClientByEmail", () => {
  it("ignores case and spaces", () => expect(matchClientByEmail(clients, "  anna@praxis.DE ")?.id).toBe("1"));
  it("returns null for unknown or empty email", () => {
    expect(matchClientByEmail(clients, "c@x.com")).toBeNull();
    expect(matchClientByEmail(clients, "")).toBeNull();
  });
});
