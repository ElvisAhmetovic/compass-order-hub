import { describe, expect, it } from "vitest";
import { clientOrderOwnershipFilter } from "./clientOwnership";

describe("clientOrderOwnershipFilter", () => {
  it("matches account link, company owner and login email", () => {
    expect(clientOrderOwnershipFilter("u1", "Jane@Example.com")).toBe(
      'client_id.eq.u1,client_user_id.eq.u1,contact_email.ilike."jane@example.com"',
    );
  });

  it("leaves out the email part when the client has no email", () => {
    expect(clientOrderOwnershipFilter("u1", null)).toBe("client_id.eq.u1,client_user_id.eq.u1");
    expect(clientOrderOwnershipFilter("u1", "  ")).toBe("client_id.eq.u1,client_user_id.eq.u1");
  });

  it("quotes emails so plus-addresses stay one value", () => {
    expect(clientOrderOwnershipFilter("u1", "invoice+portaltest@mediaamarketing.com")).toContain(
      'contact_email.ilike."invoice+portaltest@mediaamarketing.com"',
    );
  });
});
