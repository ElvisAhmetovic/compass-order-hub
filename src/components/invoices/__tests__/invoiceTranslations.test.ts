import { describe, it, expect } from "vitest";
import {
  ACCOUNT_NAME_TRANSLATIONS,
  INVOICE_LABELS,
  PAYMENT_PANEL,
  LINE_ITEMS,
} from "../invoiceTranslations";
import { LANGUAGES, DEFAULT_TERMS } from "../constants";

const codes = LANGUAGES.map((l) => l.code);

const requiredLabelKeys = [
  "date","dueDate","balanceDue","billTo","item","quantity","rate","amount",
  "subtotal","tax","total","notes","bankDetails","iban","bic","blz","account",
  "bank","contactPerson","companyRegistrationNumber","uidNumber",
];
const requiredAccountKeys = ["belgium","germany","uk"];
const requiredPaymentKeys = [
  "paymentAccount","iban","bic","blz","account","bank","bothAccounts",
  "sortCode","accountNumber","address",
];

function nonEmpty(v: unknown): boolean {
  return typeof v === "string" && v.trim().length > 0;
}

describe("invoice i18n completeness", () => {
  it.each(codes)("INVOICE_LABELS contains all keys for [%s]", (code) => {
    const entry = INVOICE_LABELS[code];
    expect(entry, `Missing INVOICE_LABELS["${code}"]`).toBeTruthy();
    for (const k of requiredLabelKeys) {
      expect(nonEmpty((entry as any)[k]), `INVOICE_LABELS["${code}"].${k} missing/empty`).toBe(true);
    }
  });

  it.each(codes)("ACCOUNT_NAME_TRANSLATIONS contains all keys for [%s]", (code) => {
    const entry = ACCOUNT_NAME_TRANSLATIONS[code];
    expect(entry, `Missing ACCOUNT_NAME_TRANSLATIONS["${code}"]`).toBeTruthy();
    for (const k of requiredAccountKeys) {
      expect(nonEmpty((entry as any)[k]), `ACCOUNT_NAME_TRANSLATIONS["${code}"].${k} missing`).toBe(true);
    }
  });

  it.each(codes)("PAYMENT_PANEL contains all keys for [%s]", (code) => {
    const entry = PAYMENT_PANEL[code];
    expect(entry, `Missing PAYMENT_PANEL["${code}"]`).toBeTruthy();
    for (const k of requiredPaymentKeys) {
      expect(nonEmpty((entry as any)[k]), `PAYMENT_PANEL["${code}"].${k} missing`).toBe(true);
    }
  });

  it.each(codes)("DEFAULT_TERMS contains non-empty text for [%s]", (code) => {
    expect(nonEmpty(DEFAULT_TERMS[code]), `DEFAULT_TERMS["${code}"] missing`).toBe(true);
  });

  it.each(Object.keys(LINE_ITEMS))("LINE_ITEMS['%s'] has translations for every language", (item) => {
    const entry = (LINE_ITEMS as Record<string, Record<string, string>>)[item];
    for (const code of codes) {
      expect(nonEmpty(entry[code]), `LINE_ITEMS["${item}"]["${code}"] missing`).toBe(true);
    }
  });

  it("no stray language codes in translation maps", () => {
    const allowed = new Set(codes);
    const check = (name: string, map: Record<string, unknown>) => {
      for (const code of Object.keys(map)) {
        expect(allowed.has(code), `Unexpected language "${code}" in ${name}`).toBe(true);
      }
    };
    check("INVOICE_LABELS", INVOICE_LABELS);
    check("ACCOUNT_NAME_TRANSLATIONS", ACCOUNT_NAME_TRANSLATIONS);
    check("PAYMENT_PANEL", PAYMENT_PANEL);
    check("DEFAULT_TERMS", DEFAULT_TERMS);
    for (const [item, langs] of Object.entries(LINE_ITEMS)) {
      check(`LINE_ITEMS["${item}"]`, langs as Record<string, unknown>);
    }
  });
});
