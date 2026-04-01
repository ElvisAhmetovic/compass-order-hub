

## Add VAT % Toggle to Monthly Contract Creation

### What
Add a VAT toggle (same as CreateOrderModal) to the "New Contract" modal. When enabled, the `totalValue` entered is treated as **brutto (gross)**, and the system calculates netto and VAT amount. These values are stored on the contract and used when generating monthly invoices/PDFs.

### How it works
- User enters Total Value (e.g. 1200 EUR) — this is the gross/brutto amount
- Enables VAT toggle, sets e.g. 19%
- UI shows: Netto = 1008.40, VAT = 191.60, Total = 1200.00
- Each installment stores the proportional netto/VAT split
- When invoices are generated monthly, the PDF shows netto + VAT lines correctly

### Changes

**1. Database migration — add VAT columns to `monthly_contracts`**
```sql
ALTER TABLE monthly_contracts
  ADD COLUMN IF NOT EXISTS vat_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS vat_rate NUMERIC DEFAULT 0;
```

**2. `src/components/monthly/CreateMonthlyContractModal.tsx`**
- Add `vatEnabled` (boolean) and `vatPercentage` (number, default 19) state
- Add Switch + percentage input below the Total Value / Currency row (same pattern as CreateOrderModal)
- Show breakdown card: Netto, VAT amount, Total when VAT is enabled
- Calculate: `netto = totalValue / (1 + vatRate)`, `vatAmount = totalValue - netto`
- The installment preview updates to show per-installment netto/VAT
- Pass `vat_enabled` and `vat_rate` (as decimal, e.g. 0.19) to `createContract`

**3. `src/services/monthlyContractService.ts`**
- Add `vat_enabled` and `vat_rate` to `MonthlyContract` interface
- Include them in the `createContract` insert

**4. `supabase/functions/generate-monthly-installments/index.ts`**
- In `createInvoice`: read `contract.vat_enabled` and `contract.vat_rate`
- If VAT enabled: `netAmount = monthly_amount / (1 + vat_rate)`, `vatAmount = monthly_amount - netAmount`
- Pass correct values to invoice insert and line item (`vat_rate` on line item)
- The PDF generator already handles netto/VAT/total display correctly

### Files to modify
1. **Database migration** — add `vat_enabled`, `vat_rate` columns
2. **`src/components/monthly/CreateMonthlyContractModal.tsx`** — VAT toggle UI
3. **`src/services/monthlyContractService.ts`** — interface + insert update
4. **`supabase/functions/generate-monthly-installments/index.ts`** — VAT-aware invoice creation

