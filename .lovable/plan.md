# Fix monthly invoices: bank accounts and logo

## What's wrong
- Monthly invoices print **German + Revolut (GB40…, British)**. That was the earlier setting. You now want **German + Belgian Wise (BE75903030215751 / TRWIBEB1XXX)**.
- The monthly invoice PDF has **no logo**. The monthly billing never adds one.

## Changes
1. Monthly invoice PDF bank details become:
   - German Bank Account: DE91240703680071572200 / DEUTDE2HP22
   - Wise (Belgium): BE75903030215751 / TRWIBEB1XXX
   - Revolut is removed from monthly invoices.
2. Add the new mountain-and-arrow logo to the top of the monthly invoice PDF, next to "Media Marketing".
3. Make monthly payment reminders and the monthly email use the same two accounts, so clients never see different bank details.
4. Redeploy the monthly billing so the next invoices use the fix.

## Already sent invoices
Invoices sent on 2 November (like INV-2026-1853) keep the Revolut details. I won't resend anything unless you ask. I can send a corrected copy to those clients if you want.

## Technical details
- `supabase/functions/generate-monthly-installments/index.ts`: replace the Revolut entry in the bank list with Wise BE; fetch the logo PNG and draw it with `doc.addImage` in the header.
- Mirror the same accounts in the monthly reminder function and the client-side monthly PDF path.
- Update the architecture rule about monthly accounts in AGENTS.md.
