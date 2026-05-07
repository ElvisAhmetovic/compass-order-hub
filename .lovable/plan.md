## Fix wrong company registration & UID numbers

The wrong defaults are hardcoded in several places. Replace with the correct values:

- Firmenregistrierungsnummer: `15746871` (was `15748871` / `123456789`)
- UID-Nummer: `13426 27369` (was `DE123418679` / `VAT123456789`)

### Files to update

1. `src/services/companySettingsService.ts` (lines 70-71) — DEFAULT_COMPANY_SETTINGS
2. `src/utils/proposal/companyInfo.ts` (lines 16-17) — DEFAULT_COMPANY_INFO (proposals)
3. `src/utils/proposal/pdfGenerator.ts` (lines 534-535) — fallback in proposal PDF footer
4. `src/utils/invoicePdfGenerator.ts` (lines 676-677) — fallback for invoice PDF
5. `src/components/invoices/InvoicePreview.tsx` (lines 517-518) — preview fallback
6. `src/pages/InvoiceDetail.tsx` (lines 67-68) — invoice detail fallback
7. `supabase/functions/generate-monthly-installments/index.ts` (lines 297-298) — monthly auto-invoice email/PDF

### Note
These are fallbacks used when no company settings are loaded from DB. I'll also check the `company_settings` row in the DB and update it via migration if it still holds the old values, so saved invoices regenerate correctly.

No UI/business-logic changes — string/value replacements only.