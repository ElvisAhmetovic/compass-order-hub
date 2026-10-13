import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { PAYMENT_ACCOUNT_OPTIONS, PAYMENT_ACCOUNTS, filterAccountsByChoice } from "../constants";

const files = ["src/components/invoices/InvoicePreview.tsx", "src/utils/invoicePdfGenerator.ts"];

describe("every tickable account prints on preview and PDF", () => {
  for (const f of files) {
    const src = readFileSync(f, "utf8");
    for (const opt of PAYMENT_ACCOUNT_OPTIONS) {
      it(`${f} includes ${opt.id}`, () => {
        const acc = PAYMENT_ACCOUNTS.find((a) => a.id === opt.id)!;
        expect(src).toContain(`id: "${opt.id}"`);
        expect(src).toContain(acc.iban.replace(/\s/g, ""));
      });
    }
  }
  it("Payoneer prints with LU574080000049188578", () => {
    expect(readFileSync(files[1], "utf8")).toContain("LU574080000049188578");
  });
  it("prints accounts in tick-box order", () => {
    const accs = ["germany", "revolut", "wise", "payoneer"].map((id) => ({ id }));
    expect(filterAccountsByChoice(accs, ["revolut", "payoneer", "germany", "wise"]).map((a) => a.id))
      .toEqual(["germany", "wise", "payoneer", "revolut"]);
  });
});
