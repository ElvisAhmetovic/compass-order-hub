# Rename the payment account tick boxes and add Payoneer

## Tick boxes in Template Settings → Payment Information
| Today | New |
|---|---|
| German Bank Account (Media Marketing LTD) | unchanged |
| Revolut Account (Media Marketing LTD) | **WEBS WORKERS LTD REVOLUT** |
| Wise Account (Web Workers LTD) | **MEDIA MARKETING LIMITED WISE** |
| — | **MEDIA MARKETING LIMITED PAYONEER** (new, unticked by default) |

## New Payoneer account
- IBAN **LU574080000049188578**, BIC **BCIRLULL**
- When ticked, it appears on the invoice preview and PDF with the account title "Payoneer", like the other accounts.

## Not changed
- Account titles printed on invoices: German, Revolut and Wise keep exactly what they show today.
- Default ticks stay German + Revolut.
- Monthly invoices, offers and reminder emails keep listing German + Revolut only.
- IBANs and BICs of the existing accounts (they already match the list).

## Technical details
- `src/components/invoices/constants.ts`: update the `PAYMENT_ACCOUNT_OPTIONS` labels; add a `{ id: "payoneer", name: "Payoneer", iban, bic, bank: "Payoneer" }` entry to `PAYMENT_ACCOUNTS` and options.
- Extend `paymentAccountChoice.test.ts`: Payoneer is selectable; the defaults don't include it; monthly accounts exclude it.
