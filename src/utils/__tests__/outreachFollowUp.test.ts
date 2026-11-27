import { describe, it, expect } from "vitest";
import { renderReplyFollowUp, followUpSkipReason, type ReplyTemplate } from "../../../supabase/functions/_shared/outreachRules";

const t: ReplyTemplate = { enabled: true, subject_en: "Thanks {client_name}", body_en: "Hi {client_name} from {company_name}, {sender_name} calls you.",
  subject_de: "Danke {client_name}", body_de: "Hallo {client_name}, {sender_name} meldet sich." };
const base = { template: t, linkedToOffer: true, fromEmail: "anna@praxis.de", subject: "Re: Angebot", headers: {}, optedOut: false, alreadySent: false };

describe("renderReplyFollowUp", () => {
  it("uses German for de offers and fills placeholders", () => {
    const r = renderReplyFollowUp(t, "de", { client_name: "Anna", sender_name: "Johann Nowak" });
    expect(r.subject).toBe("Danke Anna");
    expect(r.text).toBe("Hallo Anna, Johann Nowak meldet sich.");
  });
  it("uses English otherwise and escapes HTML", () => {
    const r = renderReplyFollowUp(t, "en", { client_name: "<b>X</b>", company_name: "Praxis", sender_name: "JN" });
    expect(r.text).toContain("from Praxis, JN calls you");
    expect(r.html).toContain("&lt;b&gt;X&lt;/b&gt;");
    expect(r.html).not.toContain("<b>X");
  });
});

describe("followUpSkipReason", () => {
  it("allows a normal client reply", () => expect(followUpSkipReason(base)).toBeNull());
  it("skips when switched off", () => expect(followUpSkipReason({ ...base, template: { ...t, enabled: false } })).toBe("disabled"));
  it("skips replies not linked to an offer", () => expect(followUpSkipReason({ ...base, linkedToOffer: false })).toBe("not_linked"));
  it("sends at most one per offer", () => expect(followUpSkipReason({ ...base, alreadySent: true })).toBe("already_sent"));
  it("skips opted-out clients", () => expect(followUpSkipReason({ ...base, optedOut: true })).toBe("opted_out"));
  it("skips bounces and noreply senders", () => {
    expect(followUpSkipReason({ ...base, fromEmail: "MAILER-DAEMON@x.com" })).toBe("system_sender");
    expect(followUpSkipReason({ ...base, fromEmail: "noreply@x.com" })).toBe("system_sender");
  });
  it("skips our own addresses", () => expect(followUpSkipReason({ ...base, fromEmail: "a@replies.mediaamarketing.com" })).toBe("own_address"));
  it("skips auto-replies by header or subject", () => {
    expect(followUpSkipReason({ ...base, headers: { "Auto-Submitted": "auto-replied" } })).toBe("auto_reply");
    expect(followUpSkipReason({ ...base, headers: { Precedence: "bulk" } })).toBe("auto_reply");
    expect(followUpSkipReason({ ...base, subject: "Abwesenheitsnotiz: Re: Angebot" })).toBe("auto_reply");
    expect(followUpSkipReason({ ...base, subject: "Out of Office" })).toBe("auto_reply");
  });
});
