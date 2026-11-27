import { describe, it, expect } from "vitest";
import { renderOutreachHtml, replySubject } from "../../../supabase/functions/_shared/outreachRules";

describe("team reply email", () => {
  it("escapes client-visible text and keeps contact + unsubscribe", () => {
    const h = renderOutreachHtml("Hi <b>x</b>\n\nBye", { de: false, contactName: "Anna", unsubUrl: "https://u" });
    expect(h).toContain("Hi &lt;b&gt;x&lt;/b&gt;");
    expect(h).toContain("Your contact: Anna");
    expect(h).toContain('href="https://u"');
  });
  it("uses German labels for German offers", () => {
    expect(renderOutreachHtml("Hallo", { de: true, contactName: "Anna", unsubUrl: "u" })).toContain("Ihr Ansprechpartner: Anna");
  });
  it("adds Re: only once", () => {
    expect(replySubject("Offer")).toBe("Re: Offer");
    expect(replySubject("RE: Offer")).toBe("RE: Offer");
  });
});
