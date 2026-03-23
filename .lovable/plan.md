

## Rename "Bankrekening België" to "Belgian Bank Account"

### Problem
The Belgian bank account label is in Dutch ("Bankrekening België") while the German one is in English ("German Bank Account"). Boss wants consistency — both in English.

### Changes
Replace "Bankrekening België" with "Belgian Bank Account" in all 8 files where it appears:

**Edge Functions (4 files — need redeployment):**
1. `supabase/functions/send-client-payment-reminder/index.ts` — 2 occurrences (lines 154, 206)
2. `supabase/functions/send-payment-reminder/index.ts` — 1 occurrence (line 63)
3. `supabase/functions/send-invoice-payment-reminders/index.ts` — 1 occurrence (line 273)
4. `supabase/functions/send-order-payment-reminders/index.ts` — 1 occurrence (line 181)
5. `supabase/functions/generate-monthly-installments/index.ts` — 1 occurrence (line 51)

**Frontend (3 files):**
6. `src/components/invoices/constants.ts` — 1 occurrence (line 17)
7. `src/components/invoices/InvoicePreview.tsx` — 1 occurrence (line 53, this is the Dutch translation so it stays as the Dutch label there; but the English entry likely also says "Bankrekening België")
8. `src/utils/invoicePdfGenerator.ts` — 1 occurrence (line 346, same — Dutch translation keeps Dutch label)

For the invoice preview and PDF generator, the Dutch translation ("nl") can keep the Dutch name, but the English ("en") and default labels should say "Belgian Bank Account". I'll check those files to confirm the English entries too.

### Scope
Simple find-and-replace of the label text. No logic changes. Edge functions will be redeployed after.

