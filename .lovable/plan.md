

## Localize Automated Monthly Invoice Emails by Client Country

### What
Currently, the `generate-monthly-installments` edge function sends all automated monthly invoices in **German only** — the email body, subject line, PDF labels (Rechnung, Beschreibung, Menge, etc.), invoice notes, and month names are all hardcoded in German. 

This change will detect the client's language from their `company_address` (using the same `detectLanguageFromAddress` pattern already used in the payment reminder system) and localize:
1. **Client email** — subject line, greeting, body text
2. **Invoice PDF** — all labels (Invoice, Description, Quantity, Amount, etc.)
3. **Invoice DB notes** — stored in client's language
4. **Month labels** — localized month names (e.g. "April" in Danish = "April", in Czech = "Duben")

Team notifications stay in German (internal).

### How

**File: `supabase/functions/generate-monthly-installments/index.ts`**

1. **Add `detectLanguageFromAddress` function** — same regex map as in `send-invoice-payment-reminders` (DE, NL, FR, ES, DA, NO, CS, PL, SV, default EN)

2. **Add translation objects** for all 10 languages covering:
   - Month names (`monthNames[lang]`)
   - PDF labels: "Invoice", "Invoice Recipient", "Invoice Number", "Invoice Date", "Due Date", "Description", "Quantity", "Unit Price", "Total", "Net Amount", "VAT", "Total Amount", "Payment Terms", "Bank Details", payment terms text
   - Email: subject template, greeting, body text, closing
   - Invoice DB fields: `notes`, `payment_terms`

3. **In the main processing loop**, for each contract:
   - Call `detectLanguageFromAddress(contract.company_address)` to get the language
   - Pass the language to `generateInvoicePDF()` so all PDF labels render in the correct language
   - Pass the language to `sendInvoiceEmail()` so the email subject and body are localized
   - Use localized month name instead of hardcoded `germanMonths`
   - Store localized `notes` and `payment_terms` on the invoice record

4. **Update `generateInvoicePDF` signature** to accept a `lang` parameter and use translated labels instead of hardcoded German strings

5. **Update `sendInvoiceEmail` signature** to accept a `lang` parameter and use translated email templates

6. **Team notifications remain in German** — no changes to `sendTeamNotifications` or `createTeamNotifications`

### Technical Details

- 10 languages supported: EN, DE, NL, FR, ES, DA, NO, CS, PL, SV
- The `company_address` field on `monthly_contracts` is used for detection (same field used in the payment reminder system)
- If no country match is found, defaults to English
- No database changes needed — only the edge function code changes
- The function must be redeployed after the update

### Files to modify
1. `supabase/functions/generate-monthly-installments/index.ts` — Add language detection, translations, and localize PDF + email output

