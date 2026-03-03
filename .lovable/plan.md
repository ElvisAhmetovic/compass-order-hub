

## Change Default VAT Rate from 19% to 0%

The VAT rate is hardcoded to `0.19` (19%) in multiple places across the codebase. The fix is to change all these defaults to `0` so invoices reflect the exact order price without automatic VAT markup. Users can still manually set VAT when needed.

### Files to modify

1. **`src/pages/InvoiceDetail.tsx`** (line ~153) — new line item default: `vat_rate: 0.19` → `0`
2. **`src/components/dashboard/OrderActions.tsx`** (lines ~126, ~143) — auto-generated invoice from order: `vat_rate: 0.19` → `0`
3. **`src/components/dashboard/OrderRow.tsx`** (line ~177) — invoice from order row: `vat_rate: 0.19` → `0`
4. **`src/services/invoiceService.ts`** (line ~572) — proposal-to-invoice conversion: `vat_rate: 0.19` → `0`
5. **`src/components/monthly/MonthlyInstallmentsTable.tsx`** (line ~107) — monthly installment invoice: `vat_rate: 0.19` → `0`
6. **`src/components/monthly/SendMonthlyInvoiceDialog.tsx`** (lines ~117, ~143) — send monthly invoice: `vat_rate: 0.19` → `0`, also fix the `line_total` calculation (remove `* 1.19`)
7. **`supabase/functions/generate-monthly-installments/index.ts`** (line ~141) — edge function: `vat_rate: 0.19` → `0`, and update the PDF generation that hardcodes "MwSt. (19%)"

Also need a migration to change the DB column default:
8. **New migration** — `ALTER TABLE invoice_line_items ALTER COLUMN vat_rate SET DEFAULT 0;`

All 7 source files + 1 edge function + 1 migration. No UI changes needed — the VAT field remains editable per line item.

