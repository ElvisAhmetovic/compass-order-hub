# Update company and bank details on invoices, offers and emails

## New details
- Company name: **Media Marketing Limited** (replaces AB MEDIA TEAM LTD / AB MEDIA TEAM on invoices, offers and client emails)
- Unternehmensnummer / Company number: **17507679** (replaces 15746871)
- Büroadresse / Office address: **Düsseldorfer Str. 32, 47051 Duisburg** (replaces Weseler Str. 73, 47169 Duisburg)
- New bank account added: **IBAN GB40 REVO 2301 2083 3444 14**, BIC **REVOGB21**, Revolut Ltd
- German Postbank account (DE91 2407 0368 0071 5722 00, DEUTDE2HP22) **stays** — both accounts are shown

## Where it changes
- Invoice PDFs and the invoice preview (header, footer, payment block with both accounts)
- Offer/proposal PDFs and offer detail page
- Monthly-package invoice PDFs and their "Send to client" email templates (all 10 languages): subject and signature say Media Marketing Limited, address updated, both accounts listed
- Invoice "Send to Client" email, payment reminders (manual and automatic), order reminders, payment confirmation and service-delivered emails: company name, signature address and both accounts
- Default company settings (used as fallback) and the saved company settings record, so the Invoice Template Settings screen shows the new name, number and address
- Approved EN/DE reminder wording keeps its text; only company name, address and bank lines change

## Not changed
- Invoice numbers, amounts, statuses, reminder schedules, sending addresses (still noreply@abm-team.com)
- Public website (already updated)
- Phone number +49 203 7090 7262 in signatures (not part of this update)

## Technical details
- Add a Revolut entry to `PAYMENT_ACCOUNTS` and render all active accounts in invoice/offer/monthly PDFs.
- Update `DEFAULT_COMPANY_INFO`, `companySettingsService` defaults, and the `company_settings` row via SQL update.
- Update `monthlyInvoiceTemplates.ts`, `paymentReminderCopy.ts`, and mirrored edge functions (send-invoice-pdf, send-*-payment-reminder(s), generate-monthly-installments, send-payment-confirmation, send-service-delivered-notification, send-offer-email).
- Update AGENTS.md rule on active payment accounts and memory (CRM entity is now Media Marketing Limited; two active accounts).
- Update existing tests (monthlyInvoiceTemplates, paymentReminderCopy) to assert new IBAN/BIC, company number and address; run them; check PDFs render without overflow.
