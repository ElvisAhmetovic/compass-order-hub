# New logo, website and payment account choice

## 1. New default company logo
- Use the uploaded AB arrow logo as the default **Company Logo** in Invoice Template Settings.
- It replaces the old default on invoice PDFs and the invoice preview whenever no other logo has been chosen.
- Anyone who had the old default saved is switched to the new one automatically; a custom logo someone uploaded on purpose is kept.

## 2. Website
- Change the default and saved company website from www.abmedia-team.com to **https://www.abm-team.com**.
- Applies to invoices, offer PDFs, monthly invoices and the website links in client emails (offer, order created, monthly contract emails).
- Team email addresses ending in @abmedia-team.com are left alone (those are mailboxes, not the website).

## 3. Payment account choice
- The **Payment Account** dropdown in template settings gets three options:
  - German Bank Account only
  - Revolut Account only
  - Both accounts
- Default: **Both accounts** (matches today).
- The choice controls which bank details appear on the invoice preview and the invoice PDF, and it is remembered like the other template settings.
- Monthly invoice PDFs, offers and reminder emails keep showing both accounts.

## Technical details
- Upload logo via lovable-assets; set `DEFAULT_COMPANY_LOGO` to its URL; in `useInvoiceSettings` replace a saved old default path with the new one.
- `selectedPaymentAccount` accepts `"germany" | "revolut" | "all"`; stop forcing it to `"germany"`; `InvoicePreview` and `invoicePdfGenerator` filter accounts by it; callers that hardcode `"germany"` (InvoiceDetail, SendMonthlyInvoiceDialog, SendClientReminderModal) default to `"all"`.
- Update website in `companyInfo.ts`, `companySettingsService.ts`, proposal PDF fallback, generate-monthly-installments, email footers, and the saved `company_settings` row.
- Add a small test for the account filter (germany / revolut / all).
