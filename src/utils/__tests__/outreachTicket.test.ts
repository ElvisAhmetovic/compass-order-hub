import { describe, it, expect } from "vitest";
import { buildOutreachTicket } from "../../../supabase/functions/_shared/outreachRules";

const reply = { from_email: "a@b.de", from_name: "Anna", subject: "Re: Offer", text_body: "Interested!" };

describe("buildOutreachTicket", () => {
  it("names the team member who sent the offer", () => {
    const t = buildOutreachTicket(reply, { subject: "Spring offer", approved_by_name: "Johann Nowak", company_name: "Praxis X" });
    expect(t.notes).toContain("Offer sent by Johann Nowak");
    expect(t.subject).toBe("Outreach reply: Re: Offer");
    expect(t.status).toBe("open");
    expect(t.company_name).toBe("Praxis X");
    expect(t.message).toBe("Interested!");
  });
  it("still creates a ticket for unmatched replies", () => {
    const t = buildOutreachTicket(reply, null);
    expect(t.notes).toMatch(/Unmatched outreach reply/);
    expect(t.client_email).toBe("a@b.de");
  });
  it("limits subject length", () => {
    const t = buildOutreachTicket({ ...reply, subject: "x".repeat(500) }, null);
    expect(t.subject.length).toBe(300);
  });
});
