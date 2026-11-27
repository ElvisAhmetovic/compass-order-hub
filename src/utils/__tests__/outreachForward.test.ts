import { describe, it, expect } from "vitest";
import { shouldForwardReply, renderForwardEmail } from "../../../supabase/functions/_shared/outreachRules";

const base = { linked: true, bulk: false, autoReply: false, fromTeam: false, alreadyForwarded: false, to: "max@x.de" };
describe("forwarding client replies to the offer sender", () => {
  it("forwards a real reply to an offer", () => expect(shouldForwardReply(base)).toBe(true));
  it("never forwards unlinked, bulk, automatic, team-sent, repeated or ownerless replies", () => {
    for (const k of [{ linked: false }, { bulk: true }, { autoReply: true }, { fromTeam: true }, { alreadyForwarded: true }, { to: null }])
      expect(shouldForwardReply({ ...base, ...k })).toBe(false);
  });
  it("names the client and business and escapes the message", () => {
    const m = renderForwardEmail({ clientName: "Anna", companyName: "Dental AG", subject: "Re: Offer", offerDate: "01.11.2026", text: "<hi>", link: "https://l" });
    expect(m.subject).toBe("Client reply: Re: Offer – Dental AG");
    expect(m.html).toContain("Anna replied to your offer from 01.11.2026.");
    expect(m.html).toContain("&lt;hi&gt;");
  });
});
