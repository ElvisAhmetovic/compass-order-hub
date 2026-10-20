# Fix: invoices forget VAT (PDV) after Save

## What I found
- VAT per line does reach the database in some cases: 22 lines in the last 60 days have VAT saved, the latest on 19 Oct.
- All 12 invoices edited this morning have 0% VAT.
- The **VAT rate** and **Enable VAT** settings in Template Settings are stored only in that worker's browser. They are not saved on the invoice, and the VAT rate is never copied into the lines. So a colleague, another computer, or a cleared browser opens the invoice with VAT switched off or at 0%.
- Every new line starts at 0%, whatever VAT rate is set in Template Settings.
- When the total is fixed and VAT is changed, the net price is recalculated backwards. This can make it look as if VAT "did nothing".

The exact cause is not confirmed yet, so step 1 is to reproduce it.

## Steps
1. **Reproduce in the preview:** open an invoice, set 19% VAT on a line, Save, reopen it, and check the screen, the PDF and the database. This confirms which of the causes above is behind it.
2. **Save VAT on the invoice itself:** store "VAT on/off" and the VAT rate with each invoice, not in the browser, so every colleague and every computer sees the same thing.
3. **Use the template VAT rate for new lines:** when VAT is on, new lines start at the template rate (for example 19%) instead of 0%.
4. **Reopen shows the same thing:** after Save, the editor, preview, PDF and Send to Client all show the saved VAT and totals.
5. **Tests:** saving 19% on a 100 € net line gives 19 € VAT and 119 € total after reopening, and a new line takes the template rate.

Existing invoices are not changed.

## Technical details
- Add `vat_enabled boolean default true` and `vat_rate_default numeric(5,4)` to `invoices`. Pass both through `update_invoice_with_lines` (header) and `createInvoice`.
- `InvoiceDetail.tsx`: load `templateSettings.vatEnabled` and `vatRate` from the invoice row on load. `addLineItem` uses `vatRate/100` when VAT is enabled.
- The preview and `invoicePdfGenerator` already read `templateSettings.vatEnabled` and `vat_rate` per line, so they use the per-invoice values automatically.
- Check the order-to-invoice path (`resolveOrderClient` / create from order) and `createFromProposal` (it hard-codes `vat_rate: 0`) so they also apply the default.
