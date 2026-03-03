

## Fix Remaining Payment Account & VAT Defaults

Three files still have the old defaults hardcoded:

1. **`src/pages/InvoiceDetail.tsx`** (line 48-50) — change `vatRate: 19` → `0` and `selectedPaymentAccount: 'belgium'` → `'both'`
2. **`src/components/orders/SendClientReminderModal.tsx`** (line 165-167) — change `selectedPaymentAccount: "belgium"` → `"both"` and `vatRate: 19` → `0`
3. **`src/components/monthly/SendMonthlyInvoiceDialog.tsx`** (line 163) — change `vatRate: 19` → `0` (payment account already says "both" here)

