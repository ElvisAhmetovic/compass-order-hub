# Replace the retired Belgian account everywhere

## Goal
Remove the retired Belgian bank details from every active invoice, offer, PDF, payment option, preview, reminder email, and saved company setting. Replace them with:

- **Bank:** Wise Europe SA
- **IBAN:** BE54 9059 9786 7497 (stored canonically as `BE54905997867497`)
- **SWIFT/BIC:** TRWIBEB1XXX
- **Bankleitzahl / BLZ:** 905
- **Kontonummer:** 905997867497

The German and UK accounts remain unchanged.

## Confirmed locations to update

### Invoice screens and generated PDFs
- Replace the account in the payment-account selector and payment-information panel.
- Replace it in the live invoice preview and browser-generated invoice PDF.
- Change the account heading from “Belgian Bank Account” and its translations to “Wise Europe SA”, so the old Belgian label no longer appears.
- Keep the existing account identifier internally where necessary so saved invoice/template selections continue working.

### Offers and offer PDFs
- Replace all default and fallback payment values on the offer details page.
- Replace the values used by the offer PDF generator and company-information fallback.
- Update the visible placeholders in the offer payment editor.
- Preserve any explicitly customized offer payment details that do not match the retired account.

### Automated invoices and emails
- Replace the account in monthly-installment invoice generation.
- Replace it in manual payment reminders, client payment reminders, order payment reminders, and automatic invoice payment reminders.
- Deploy every changed email/automation function so live messages immediately use the new account.

### Saved settings and documentation
- Update the current `company_settings` record, which was confirmed to still contain the retired IBAN, BIC, and BLZ.
- Safely replace retired values in any saved proposal payment fields if matching records exist; unrelated customized values will not be touched.
- Update the invoicing specification so it no longer documents the invalid account.

## Verification
- Search the entire project for the retired IBAN, account number, BLZ, and old “Belgian Bank Account” labels; require zero active matches.
- Confirm the new IBAN, SWIFT, bank name, BLZ, and account number in invoice options, invoice preview, invoice PDF, offer editor/PDF, and all reminder templates.
- Run the relevant automated checks and TypeScript validation.
- Confirm the database no longer contains the retired values in company settings or proposal payment fields.

## Important scope note
Previously downloaded PDFs and emails already delivered to clients cannot be changed retroactively. All newly opened previews, newly generated PDFs, and future emails will use the replacement details.
