# Temporarily use only the German payment account

## Goal
Until the banking issues are resolved, show **only the existing German account** in current customer-facing invoices, offers, payment instructions, and reminders. Do **not** introduce the new Belgian Wise details yet.

German account stays unchanged: IBAN `DE91240703680071572200`, BIC `DEUTDE2HP22`, bank `Postbank/DSL Ndl of Deutsche Bank`.

## Changes
1. **Invoices and previews:** Remove Belgian, UK, and “all accounts” choices from invoice template settings. Ensure existing saved browser preferences for those choices resolve to Germany, so editing, previewing, downloading, sending, and attaching an invoice never outputs the withdrawn accounts. Apply the same rule to monthly-package invoice PDFs and reminder PDF attachments.
2. **Offers and company payment data:** Replace Belgian defaults, placeholders, and the offer PDF’s Belgian bank label/account-number fallback with the German account. The database check found one `company_settings` row still storing the withdrawn Belgian IBAN/BIC and no proposal rows with a non-German IBAN; update only the matching saved company payment fields, preserving unrelated company data. Check any stored offer/payment text before changing it.
3. **Email wording:** Remove Belgian/UK details from the four reminder-sending functions and from the monthly invoice generation function. Replace the “new Belgian bank account” notice in all ten invoice-email languages with neutral German-account payment instructions; keep the rest of each message, including the payment deadline and signature. Update the corresponding tests.
4. **Labels and documentation:** Remove obsolete account-choice labels and update the invoicing specification to describe the temporary German-only state.

## Technical details
- Normalize old local `selectedPaymentAccount` values (`belgium`, `uk`, `both`) to `germany` before any display/PDF path, rather than trusting saved selection IDs. Preserve language code `uk` (Ukrainian) and unrelated geographic references.
- Use a **data-only SQL update** for the confirmed saved Belgian `company_settings` payment fields; no schema migration. Do not overwrite the German account with the proposed new Belgian Wise account.
- Deploy the changed monthly-generation and reminder functions after review. Do not send a real customer email as a test.

## Verification and limits
- Check each invoice account setting, preview, generated PDF, send-to-client attachment, monthly-package PDF, offer PDF, and reminder body for German details only; verify old saved selections still work.
- Search active customer-facing code for withdrawn Belgian/UK account numbers, bank labels, and the obsolete bank-change notice. Run relevant tests and check preview diagnostics.
- Previously downloaded PDFs and already-sent emails cannot be recalled or changed. This changes newly generated documents and future messages; it does not delete historical records.
