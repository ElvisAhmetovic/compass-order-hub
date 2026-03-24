

## Add UK Bank Account to Payment System

### What We're Adding
A third bank account option — **UK Bank Account (Wise)** — alongside the existing Belgian and German accounts. It will appear in the invoice template dropdown, render on invoice PDFs, show in the invoice preview, and be included in all payment reminder emails.

**UK Account Details:**
- Account holder: Ab Media team Ltd
- Sort code: 23-14-70
- Account number: 59849633
- IBAN: GB73 TRWI 2314 7059 8496 33
- Wise's address: 56 Shoreditch High Street, London

### Changes Required

**1. Update `PaymentAccount` interface and constants** (`src/components/invoices/constants.ts`)
- Add `sortCode` and `accountNumber` optional fields to the `PaymentAccount` interface
- Add the UK account entry to `PAYMENT_ACCOUNTS` array

**2. Update Payment Information settings UI** (`src/components/invoices/components/PaymentInformation.tsx`)
- Add translated labels for "Sort Code" and "Account Number" to all 10 languages
- Render sort code / account number fields when present
- Update "Both Accounts" to "All Accounts" in translations (since there are now 3)

**3. Update Invoice Preview** (`src/components/invoices/InvoicePreview.tsx`)
- Add UK account object with translated name ("UK Bank Account" in English, localized in other languages)
- Add "uk" translations to all 10 language blocks in `getAccountTranslations`
- Update the `selectedAccounts` logic to include the UK account when "both" (now "all") is selected
- Add sort code / account number rendering

**4. Update Invoice PDF Generator** (`src/utils/invoicePdfGenerator.ts`)
- Same changes as Invoice Preview: add UK account, translations, selection logic, sort code / account number rendering in PDF output

**5. Update 5 Edge Functions** (add UK bank details to email HTML)
- `supabase/functions/send-payment-reminder/index.ts`
- `supabase/functions/send-client-payment-reminder/index.ts`
- `supabase/functions/send-invoice-payment-reminders/index.ts`
- `supabase/functions/send-order-payment-reminders/index.ts`
- `supabase/functions/generate-monthly-installments/index.ts`

Each gets a new UK Bank Account section in the payment information HTML block, showing Sort Code, Account Number, IBAN, and the Wise address.

**6. Redeploy all 5 Edge Functions** after changes.

### Technical Notes
- The "both" value for `selectedPaymentAccount` will now mean "all three accounts" — no migration needed since the dropdown and rendering logic already handles arrays
- The UK account uses Sort Code + Account Number (UK banking standard) instead of BLZ — these are new optional fields on the interface
- No database changes needed — this is purely frontend + edge function updates

