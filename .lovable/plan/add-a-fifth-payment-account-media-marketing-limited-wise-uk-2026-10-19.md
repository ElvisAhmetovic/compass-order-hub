# Add a fifth payment account: Media Marketing Limited Wise UK (GBP)

## What changes
1. Add a new tick box under Payment Information in Template Settings, named **MEDIA MARKETING LIMITED WISE UK**.
2. It sits after MEDIA MARKETING LIMITED PAYONEER, so WEBS WORKERS LTD REVOLUT stays last. It starts unticked, and German + Revolut stay the defaults.
3. When it is ticked, the invoice preview, the downloaded PDF and the PDF attached by Send to Client show:
   - Account holder: Media Marketing Limited
   - Account number: 67278739
   - Sort code: 60-84-64
   - IBAN: GB83 TRWI 6084 6467 2787 39
   - BIC/SWIFT: TRWIGB2LXXX
   - Bank: Wise Payments Limited, Worship Square, 65 Clifton Street, London, EC2A 4JE, United Kingdom
4. These stay the same: the Send to Client email text (it shows no bank details, only the Stripe button), offers, monthly invoices and payment reminders (German + Revolut only).

## Open question
- The account name above is a suggestion. Tell me if it should be named differently, for example "MEDIA MARKETING LIMITED WISE GBP".

## Technical details
- Add a `wiseUk` entry to `PAYMENT_ACCOUNT_OPTIONS` in `src/components/invoices/constants.ts`.
- Add the account object, including the optional account-number, sort-code and bank-address lines, to `InvoicePreview.tsx` and `invoicePdfGenerator.ts`. Ticked accounts still print in option order.
- Extend `allAccountsPrinted.test.ts` and `paymentAccountChoice.test.ts` to cover the new IBAN and BIC, its order, and that it is unticked by default.
