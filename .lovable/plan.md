# Fix monthly package invoice due dates going backwards

## Problem
Invoices made from Monthly Packages get today as the issue date, but the due date is a fixed day in the month. The automatic run uses the 15th, and the manual buttons use the 1st of the installment month. So an invoice made on 29/09 can show a due date of 15/09, which is before the issue date.

## Fix
- Due date = issue date + 7 days, on every monthly invoice path. The issue date is the day the invoice is created.
- If the installment's own due date is later than that, keep the later date. A due date can never be earlier than the issue date.
- The PDF and the email show the same corrected date.
- The installment schedule in the Monthly Packages table stays unchanged. It still shows which month each payment belongs to.
- Invoices that already exist are not changed. If you want, I can also fix the ones with past due dates.

## Technical details
- `supabase/functions/generate-monthly-installments/index.ts`: at lines ~915, 931 and 990, replace the hard-coded `-15` due date with a shared `computeDueDate(issueDate, installmentDue)` helper (max of issue+7d and installmentDue). Pass the same value to `createInvoice` and to the PDF.
- `src/components/monthly/SendMonthlyInvoiceDialog.tsx` (117, 185) and `MonthlyInstallmentsTable.tsx` (158): use the same helper from a new `src/utils/monthlyDueDate.ts`.
- Add a unit test: the due date is never before the issue date, and it is 7 days after the issue date by default.
