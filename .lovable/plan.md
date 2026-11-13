# Owner name on German bank account: "Dr. Selmin Huzbasic"

Change the account owner line under the German bank account from "Selmin Huzbasic" to "Dr. Selmin Huzbasic" everywhere it appears:

- Invoice preview on screen
- Downloaded/emailed invoice PDF
- Monthly package invoice PDFs (automatic monthly invoices)

Result: "Inhaber: Dr. Selmin Huzbasic" (German) / "Owner: Dr. Selmin Huzbasic" (English).

## Technical details
- `src/components/invoices/InvoicePreview.tsx` line 82
- `src/utils/invoicePdfGenerator.ts` line 252
- `supabase/functions/generate-monthly-installments/index.ts` line 339, then redeploy that function
- Update the memory note to "Dr. Selmin Huzbasic"
