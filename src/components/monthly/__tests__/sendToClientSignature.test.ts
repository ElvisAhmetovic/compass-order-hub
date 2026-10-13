import { describe, it, expect } from "vitest";
import * as T from "../monthlyInvoiceTemplates";

const all = Object.values(T)
  .filter((v): v is Record<string, string> => !!v && typeof v === "object")
  .flatMap((m) => Object.values(m).filter((s): s is string => typeof s === "string" && s.includes("Annalena Klein")));

describe("Send to Client signature", () => {
  it("has messages to check", () => expect(all.length).toBeGreaterThan(10));
  it.each(all.map((m, i) => [i, m]))("message %i uses Media Marketing LTD and the invoice inbox", (_i, m) => {
    expect(m).toContain("Media Marketing LTD");
    expect(m).toContain("invoice@mediaamarketing.com");
    expect(m).not.toMatch(/AB MEDIA/i);
  });
});
