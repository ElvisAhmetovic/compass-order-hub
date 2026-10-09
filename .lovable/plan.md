# Invoice company details: contact person, UID, email

## What changes on invoices and offers
- **Ansprechpartner / Contact Person:** change from Andreas Berger to **Annalena Klein** (default and the saved company settings).
- **UID-Nummer 13426 27369:** removed from the invoice header (preview + PDF), offer PDF footer and monthly invoices; the default value is cleared.
- **kontakt.abmedia@gmail.com:** removed from the invoice header, offer PDF and monthly invoices; the default email is cleared, so no email line is printed.
- Applies to the invoice preview, downloaded/sent invoice PDF, offer PDF and automatic monthly invoices.

## Not changed
- kontakt.abmedia@gmail.com stays as a CRM login/permission address (finance totals, work hours) — that is a user account, not invoice text.
- Reminder email signatures already say Annalena Klein.

## Technical details
- Defaults: `src/utils/proposal/companyInfo.ts`, `src/services/companySettingsService.ts`, `InvoicePreview.tsx`, `invoicePdfGenerator.ts`, `InvoiceDetail.tsx`, `generate-monthly-installments` → contactPerson "Annalena Klein", email "", vatId "", taxNumber "".
- Render UID line and email line only when a value is set; drop the `'13426 27369'` / gmail fallbacks in `proposal/pdfGenerator.ts`.
- Update the `company_settings` row: contact_person = Annalena Klein, vat_id/tax_number/email = null.
- Clear stale values from saved template settings on load (company info already comes from the database).
- Redeploy generate-monthly-installments.
