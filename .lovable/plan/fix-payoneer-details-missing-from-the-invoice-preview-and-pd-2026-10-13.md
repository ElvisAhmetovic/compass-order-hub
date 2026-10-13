# Fix: Payoneer details missing from the invoice preview and PDF

## What's wrong
The Template Settings box lists all four accounts, but the invoice preview and the PDF only know about three: German, Revolut and Wise. Ticking Payoneer does nothing there, so its IBAN and BIC never print. German, Wise and Revolut work.

## Fix
1. Add the Payoneer account to the invoice preview and the PDF: MEDIA MARKETING LIMITED PAYONEER, IBAN LU574080000049188578, BIC BCIRLULL, bank Payoneer.
2. Print the ticked accounts in the same order as the checkboxes: German, Wise, Payoneer, Revolut.
3. Add a check that fails if any account you can tick doesn't appear on the preview or PDF, so a new account can't go missing again.

## Checked and unchanged
- Offer PDFs, monthly invoices and payment reminders always use German + Revolut. They don't follow the checkboxes, so nothing changes there.
- The Send to Client email stays without bank details. Only the Stripe button is added.

## Technical details
- `src/components/invoices/InvoicePreview.tsx` (around line 93) and `src/utils/invoicePdfGenerator.ts` (around line 263): add a `payoneerAccount` object next to `wiseAccount`. Include it in the `filterAccountsByChoice([...])` call.
- `filterAccountsByChoice` in `constants.ts`: sort the picked accounts by their position in `PAYMENT_ACCOUNT_OPTIONS`.
- Test: for every id in `PAYMENT_ACCOUNT_OPTIONS`, both files must define an account with that id and its IBAN. Also test the sort order.
