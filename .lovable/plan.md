# i18n completeness check + per-language PDF verification

Two deliverables on top of the new 23-language invoice translations.

## 1. Automated completeness check

Add a small unit test (Vitest) at `src/components/invoices/__tests__/invoiceTranslations.test.ts` that imports the four translation maps from `invoiceTranslations.ts` plus `LANGUAGES` and `DEFAULT_TERMS` from `constants.ts`, and asserts:

- Every code in `LANGUAGES` has an entry in `ACCOUNT_NAME_TRANSLATIONS`, `INVOICE_LABELS`, `PAYMENT_PANEL`, and `DEFAULT_TERMS`.
- Every line-item key in `LINE_ITEMS` has a translation for every code in `LANGUAGES`.
- For each label/line-item entry, every required sub-key (e.g. `date`, `dueDate`, `billTo`, …) is present and non-empty.
- No stray language codes exist in the translation maps that aren't in `LANGUAGES` (catches typos like `ua` vs `uk`).

Failure output names the language code + missing key so gaps are obvious. Test runs via `bunx vitest run`.

To make the check usable without exporting internals, `invoiceTranslations.ts` will export the raw maps (`ACCOUNT_NAME_TRANSLATIONS`, `INVOICE_LABELS`, `PAYMENT_PANEL`, `LINE_ITEMS`) alongside the existing accessor functions.

## 2. Per-language PDF verification

Render the live invoice preview at `/invoices/{id}` once per language by switching the language dropdown in Invoice Settings, then capture a full-page screenshot of the preview. For each of the 23 languages I'll inspect:

- Header labels (Date, Due Date, Balance Due, Bill To)
- Table headers (Item, Quantity, Rate, Amount)
- Totals block (Subtotal, Tax, Total)
- Bank Details block (account name, IBAN/BIC/BLZ/ACCOUNT/Bank labels)
- Notes / default terms paragraph
- Contact Person / Company Registration Number / UID labels

Any rendering issues (missing glyphs for Cyrillic/Greek, overflow, untranslated strings, layout breakage at long Hungarian/Finnish strings) get reported back with a fix. If the live preview matches, the generated PDF matches — both go through the same HTML template.

No production behavior changes from this verification — it's read-only QA.

## Files touched (technical)

- `src/components/invoices/invoiceTranslations.ts` — export `LINE_ITEMS` and rename internal maps to be exported (no logic change).
- `src/components/invoices/__tests__/invoiceTranslations.test.ts` — new Vitest spec.
- No changes to PDF generator, preview, or settings UI.
