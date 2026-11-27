import { describe, it, expect } from "vitest";
import { ticketSkipReason } from "../../../supabase/functions/_shared/outreachRules";

describe("ticketSkipReason", () => {
  it("opens a ticket for replies linked to an offer", () => {
    expect(ticketSkipReason({ linkedToOffer: true, knownClient: false, headers: { "List-Unsubscribe": "<x>" } })).toBeNull();
  });
  it("skips newsletters not linked to an offer, even from known senders", () => {
    expect(ticketSkipReason({ linkedToOffer: false, knownClient: true, headers: { "List-Unsubscribe": "<mailto:x>" } })).toBe("newsletter");
    expect(ticketSkipReason({ linkedToOffer: false, knownClient: false, headers: { Precedence: "bulk" } })).toBe("newsletter");
  });
  it("opens a ticket for a known client without an offer", () => {
    expect(ticketSkipReason({ linkedToOffer: false, knownClient: true, headers: {} })).toBeNull();
  });
  it("skips unknown senders without an offer", () => {
    expect(ticketSkipReason({ linkedToOffer: false, knownClient: false, headers: {} })).toBe("unknown_sender");
  });
});
