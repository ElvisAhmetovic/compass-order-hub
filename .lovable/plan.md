# Account owner names on invoice bank details

## What changes on invoices (preview, PDF, monthly invoices)
- **German account:** add a line "Inhaber: Selmin Huzbasic" (German invoices) / "Owner: Selmin Huzbasic" (other languages).
- **Wise (Belgium), Payoneer, Wise UK:** the heading on the invoice becomes **Media Marketing Limited** instead of "Media Marketing WISE" etc. IBAN, BIC and bank lines stay as they are, so clients can still tell the accounts apart.
- **Revolut:** stays as Webs Workers LTD.
- The checkbox names in Template Settings stay the same, so colleagues can still pick the right account.

## Note
This brings back "Limited" only in the bank account names, because that is the legal name on those accounts. Everywhere else the company name stays "Media Marketing".

## Technical details
- `src/components/invoices/constants.ts`: add an invoice display name and holder per account (German: holder Selmin Huzbasic; Wise/Payoneer/Wise UK: display "Media Marketing Limited").
- `InvoicePreview.tsx`, `src/utils/invoicePdfGenerator.ts`: print the display name and the localized Inhaber/Owner line.
- `generate-monthly-installments`: same for the monthly PDF (German + Belgian Wise); redeploy.
- Update the bank-account tests; update the memory note on company naming to allow "Limited" in bank account names.
