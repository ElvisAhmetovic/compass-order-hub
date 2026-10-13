# Invoices from orders: right client, right language

## What I found
- **Wrong client (Arredatutto):** today Thomas Klein made INV-2026-1705 for Arredatutto.com, which is correct. He then made INV-2026-1706 and 1707, and both were saved under the same Arredatutto client before he deleted them.
  - Two weak spots can cause this:
    1. If you open "Create Invoice" right after looking at another invoice, the new invoice form doesn't clear itself. It quietly keeps the previous client and its billing details.
    2. The order-row "Invoice" button reuses any client that has the same email, even if the company name is different. That's how Bauhöfer's Bierdeckel was invoiced as "IK Monheimer Grundbesitz GmbH", and Zonneplaneet as "Debatterijconcurrent".
  - I can't tell for sure which of the two caused 1706/1707, because those invoices were deleted. The fixes below close both.
- **Language:** the invoice language is one setting for the whole browser, not a setting per invoice. Whatever language was used last stays for the next invoice. Orders don't have a country field; the country is only written inside the order address (e.g. "Milano, Italy", "Utrecht, Netherlands", "Paris, Frankreich").

## Fixes
1. **New invoice form starts clean.** "Create Invoice" always opens an empty form: no previous client, billing details or items.
2. **Same client-matching on every order button.** All three ways of creating an invoice from an order (row "Invoice" button, "Create Invoice" in the menu, setting the status to Invoice Sent/Paid) use one safe rule:
   - Name + email both match: use that client.
   - Only the email matches: reuse the client only if the company names overlap. Otherwise make a new client for this order's company.
3. **Country from the order.** The country is read from the order address. The address can say it in English, German or the local language: Italy/Italien/Italia, Netherlands/Niederlande/Nederland, France/Frankreich, Deutschland, Schweiz/Switzerland, Dänemark, Czechia, England/UK, etc. If the address names no country, the email ending is used (.nl, .de, .it, .fr, .co.uk, ...). The country is saved on the invoice's billing details and filled on the client when it's empty.
4. **Language saved per invoice.** Each invoice remembers its own language. When it's created from an order, the language follows the country:
   - Netherlands/Belgium: Dutch
   - Germany/Austria/Switzerland: German
   - France: French
   - Italy: Italian
   - Spain: Spanish
   - Denmark: Danish
   - Norway: Norwegian
   - Czechia: Czech
   - Poland: Polish
   - Sweden: Swedish
   - Romania, Turkey, Portugal, Hungary: their own languages
   - UK and anything unknown: English
   - Opening the invoice shows the preview, PDF and Send to Client email in that language. Changing the language in Template Settings on that invoice changes only that invoice.
   - Older invoices without a saved language keep the current behaviour (the browser's last setting).
5. **Better history.** The row "Invoice" button records that it came from an order (it currently looks like a hand-made invoice). Future mix-ups can then be traced exactly.

## Existing invoices: report only
I'll list the current invoices whose client name differs from the order's company, about 11 in the last 30 days. Several are only small spelling differences of the same company. I won't change any of them unless you say so.

## Technical details
- `InvoiceDetail.tsx`: when `id === 'new'`, reset `formData`, `lineItems`, `billToOverride`, `invoice`. Also key the route element by id in `App.tsx`.
- New `src/services/orderClientResolver.ts` holds the shared name/email resolver. Use it in `OrderRow.tsx` (line 140, drops the email-only fallback), `OrderActions.tsx` and `orderService.ts` (line ~904). Pass `auditCtx` with `source: 'order_row_button'` in OrderRow.
- New `src/utils/countryLanguage.ts`: `detectCountry(address, email)` and `languageForCountry(code)`, with unit tests for the real address formats above.
- Migration: `alter table invoices add column language text` (nullable). Set it on create from order, together with `bill_to_country`.
- `InvoiceDetail` passes `invoice.language` over `templateSettings.language` to the preview, PDF and send dialog. The Template Settings language change on an existing invoice saves to `invoices.language`.
