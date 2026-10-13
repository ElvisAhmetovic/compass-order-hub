import { describe, it, expect, beforeEach } from "vitest";
import { applyLanguageNoteReset, normalizeTemplateSettings } from "../loadTemplateSettings";
import { getDefaultTerms } from "../constants";

describe("invoice notes follow the invoice language", () => {
  beforeEach(() => localStorage.clear());
  it("a new invoice ignores a note saved from an earlier (Italian) invoice", () => {
    const s = normalizeTemplateSettings({ language: "da", customTerms: "Si prega di saldare la fattura entro 7 giorni dal ricevimento. Grazie mille." });
    expect(s.customTerms).toBe("");
    expect(s.customTerms || getDefaultTerms("da")).toBe("Betal venligst fakturabeløbet uden fradrag senest på den ovenfor angivne forfaldsdato.");
  });
  it("switching language replaces a typed note", () => {
    const r = applyLanguageNoteReset({ language: "it", customTerms: "Grazie mille." }, { language: "da", customTerms: "Grazie mille." });
    expect(r.customTerms).toBe("");
  });
  it("editing the note without changing language keeps it", () => {
    const r = applyLanguageNoteReset({ language: "da", customTerms: "" }, { language: "da", customTerms: "Tak!" });
    expect(r.customTerms).toBe("Tak!");
  });
});
