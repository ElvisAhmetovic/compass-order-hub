# Add 13 new languages to invoice settings

Currently the invoice language dropdown supports 10 languages: English, German, French, Spanish, Dutch, Polish, Czech, Swedish, Danish, Norwegian. Selecting a language changes everything language-specific on the generated invoice and PDF.

You asked to add: Russian, Italian, Ukrainian, Romanian, Turkish, Portuguese, Hungarian, Greek, Bulgarian, Finnish, Slovak, Slovenian, Macedonian.

## What "language" controls on an invoice

When you change the language in Invoice Settings, these things switch automatically:

1. **Invoice labels** in the PDF and live preview — Date, Due Date, Bill To, Item, Quantity, Rate, Amount, Subtotal, Tax, Total, Notes, Bank Details, Contact Person, etc.
2. **Bank account display names** — e.g. "German Bank Account" becomes "Deutsches Bankkonto".
3. **Payment Information panel labels** in the settings UI (IBAN, BIC, Account, All Accounts, Sort Code, etc.).
4. **Default terms text** at the bottom of the invoice (the "Please pay within 3 days…" paragraph).
5. **Auto-translated common line item descriptions** (Sample Service, Consulting, Design Work, Development, Web Development, Marketing, Training, Support, Maintenance, License).

## What will be added

For each of the 13 new languages, full translations will be added in all five places above. Same coverage as the existing 10 languages — nothing on the invoice will appear in English if a non-English language is selected.

Language codes used (ISO 639-1): `ru`, `it`, `uk` (Ukrainian), `ro`, `tr`, `pt`, `hu`, `el`, `bg`, `fi`, `sk`, `sl`, `mk`. Final list in the dropdown will be 23 languages, ordered as you provided.

No backend/database changes. The PDF generator already reads `templateSettings.language` and falls back to English for unknown codes — extending the translation tables is enough.

## Files touched (technical)

- `src/components/invoices/constants.ts` — extend `LANGUAGES` list and `DEFAULT_TERMS` map.
- `src/utils/invoicePdfGenerator.ts` — extend `translateLineItemDescription`, `getAccountTranslations`, and the labels `translations` object.
- `src/components/invoices/InvoicePreview.tsx` — mirror the same three translation tables (live preview).
- `src/components/invoices/components/PaymentInformation.tsx` — extend the `getPaymentTranslations` map.

No edits to monthly/yearly invoice email templates (separate scope — those use their own German/English copy and aren't tied to this dropdown).
