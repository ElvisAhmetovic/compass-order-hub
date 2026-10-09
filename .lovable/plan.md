# Third payment account (Wise) + checkboxes

## What changes
- Add a third account: **Wise** — IBAN BE75903030215751, BIC TRWIBEB1XXX, shown on the invoice as "Media Marketing LTD WISE".
- Replace the Payment Account dropdown with **checkboxes**, one per account:
  - German Bank Account (Media Marketing LTD)
  - Revolut Account (Media Marketing LTD)
  - Wise Account (Web Workers LTD)
- The names in brackets appear only next to the checkboxes, never on the invoice.
- Default: German + Revolut ticked. Any combination works; at least one must stay ticked.
- The ticked accounts appear in the settings panel, the invoice preview and the downloaded/sent invoice PDF.
- Monthly invoices, offers and reminder emails keep German + Revolut only (unchanged).

## Technical details
- `constants.ts`: add `wise` to `PAYMENT_ACCOUNTS`; replace choice type with `selectedPaymentAccounts: string[]`; `filterAccountsByChoice` accepts an array, and maps old string values (`all`, `germany_only`, `revolut_only`, `germany`) to arrays; empty/unknown → German + Revolut.
- Checkbox labels live in a separate label map (owner suffix), not on the account data used by PDFs.
- `PaymentInformation.tsx`: shadcn `Checkbox` list; prevent unticking the last one.
- `useInvoiceSettings` / `InvoiceDetail` defaults → `["germany","revolut"]`; `InvoicePreview` and `invoicePdfGenerator` use the array.
- Update `paymentAccountChoice.test.ts`: default = German+Revolut, Wise alone, all three, legacy values.
- Update the business memory: the owner has reapproved this Belgian Wise IBAN as an invoice option.
