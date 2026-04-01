

## QA Analysis: Monthly Packages System — Issues Found

### Issues Identified

**1. CRITICAL: Edge function `findOrCreateClient` still matches by email only (line 319-326)**
The automated monthly billing (1st of each month) uses `findOrCreateClient` which queries `.eq("email", contract.client_email).maybeSingle()`. If two contracts share an email, it returns the first client found — linking the invoice to the wrong company. This is the same bug we fixed on the frontend but it was never applied to the backend edge function.

**Fix:** Update `findOrCreateClient` to match by email AND name first, fall back to email-only, then create new.

**2. VAT not passed when manually creating invoices from the UI**
- `handleCreateInvoice` in `MonthlyInstallmentsTable.tsx` (line 155-162) hardcodes `vat_rate: 0` on the line item, ignoring the contract's `vat_enabled`/`vat_rate`.
- `SendMonthlyInvoiceDialog.tsx` (line 119-126) also hardcodes `vat_rate: 0` when auto-creating invoices.
- The PDF generation in `SendMonthlyInvoiceDialog` (lines 169-171) hardcodes `vatEnabled: true, vatRate: 0` instead of using the contract's VAT settings.

**Fix:** Read `contract.vat_enabled` and `contract.vat_rate` and pass the correct values to line items and PDF generation.

**3. No issues found with:**
- Autofill from order search — correctly fills company info fields
- Client matching on frontend (already fixed with email+name priority)
- Contract creation modal — VAT toggle works, installments preview correct
- Installment status toggles (paid/invoice sent) — correctly sync with invoice status
- Payment reminder activation — `next_reminder_at` set correctly on invoice send
- Edge function invoice creation — VAT-aware, language detection works
- Team notifications — PDF attached, batched correctly
- Delete contract — works with confirmation dialog
- Search/filter — works across contracts

### Plan

**File 1: `supabase/functions/generate-monthly-installments/index.ts`**
- Update `findOrCreateClient` (lines 319-341) to match by email+name first:
```typescript
async function findOrCreateClient(supabase: any, contract: any): Promise<string> {
  // Try email + name match first
  const { data: exactMatch } = await supabase
    .from("clients")
    .select("id")
    .eq("email", contract.client_email)
    .eq("name", contract.client_name)
    .maybeSingle();
  if (exactMatch) return exactMatch.id;

  // Fallback: email only
  const { data: emailMatch } = await supabase
    .from("clients")
    .select("id")
    .eq("email", contract.client_email)
    .maybeSingle();
  if (emailMatch) return emailMatch.id;

  // Create new
  ...
}
```

**File 2: `src/components/monthly/MonthlyInstallmentsTable.tsx`**
- In `handleCreateInvoice` (line 155-162): use contract's VAT rate on the line item instead of hardcoded 0
- Calculate net price from `inst.amount` using the contract's VAT rate

**File 3: `src/components/monthly/SendMonthlyInvoiceDialog.tsx`**
- In auto-create invoice block (line 119-126): use contract's VAT rate on line item
- In PDF template settings (line 169-171): set `vatEnabled` and `vatRate` from contract
- Calculate correct net price for the line item

### Files to modify
1. `supabase/functions/generate-monthly-installments/index.ts` — Fix `findOrCreateClient` email+name matching
2. `src/components/monthly/MonthlyInstallmentsTable.tsx` — VAT-aware manual invoice creation
3. `src/components/monthly/SendMonthlyInvoiceDialog.tsx` — VAT-aware auto-create invoice + PDF

