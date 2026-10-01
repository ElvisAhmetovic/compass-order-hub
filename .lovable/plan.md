# Replace the UK bank account everywhere

## Goal
Replace the retired UK Wise account with the new details in every active customer-facing location:

- **Account holder:** Ab Media Team Ltd
- **IBAN:** GB61TRWI60846495854753 (displayed as `GB61 TRWI 6084 6495 8547 53`)
- **SWIFT/BIC:** TRWIGB2LXXX
- **Account number:** 95854753
- **Sort code:** 60-84-64
- **Bank/address:** Wise Payments Limited, Worship Square, 65 Clifton Street, London, EC2A 4JE, United Kingdom

The Belgian and German accounts remain unchanged.

## Changes

### Invoices and PDFs
- Update the UK account option used in invoice payment settings.
- Update the live invoice preview and browser-generated invoice PDF.
- Show the supplied account holder, SWIFT/BIC, account number, sort code, and complete Wise address.
- Keep the internal `uk` account identifier unchanged so existing invoice/template selections continue working.

### Monthly invoices and reminders
- Update the UK details in automatically generated monthly-package invoice PDFs.
- Update manual payment reminders, client payment reminders, order payment reminders, and automatic invoice payment reminders.
- Deploy all changed reminder and monthly-invoice functions so future live emails and PDFs use the new account immediately.

### Saved data and documentation
- The database check found no saved company setting, offer, or offer-template record containing the retired UK IBAN, account number, sort code, or address, so no current database rows require replacement.
- Update the invoicing specification with the new UK account details.

## Verification
- Search the active project for the retired IBAN, account number, sort code, and Shoreditch address; require zero active matches outside archived historical plans.
- Confirm the new account holder, IBAN, SWIFT/BIC, sort code, account number, and full bank address in the account selector, invoice preview, invoice PDF, monthly invoice PDF, and every reminder template.
- Run the relevant tests and TypeScript checks, then confirm the preview build remains healthy.

## Scope note
Previously downloaded PDFs and emails already sent to clients cannot be changed. Newly opened previews, newly generated PDFs, and future emails will use the replacement details.
