

## Fix Invoice Saving and Default Prefix

### Problems Identified

1. **Invoice number prefix defaults to "RE NR:"** causing display like `RE NR:INV-2026-023`. Should default to empty string so it just shows `INV-2026-023`.

2. **Template settings don't persist properly** -- the parent `InvoiceDetail` initializes `templateSettings` with hardcoded defaults (ignoring localStorage), and the `useInvoiceSettings` hook overwrites with its own defaults. The two systems fight each other.

3. **Preview/PDF fallback to "RE NR:"** when prefix is empty/falsy -- the `||` operator treats empty string as falsy, so clearing the prefix still shows "RE NR:".

### Changes

**`src/components/invoices/hooks/useInvoiceSettings.ts`** (line 51)
- Change default `invoiceNumberPrefix` from `"RE NR:"` to `""`

**`src/components/invoices/InvoicePreview.tsx`** (lines 551, 554)
- Change fallback from `|| "RE NR:"` to remove the fallback (use `?? ""` or just use the value directly), so an empty prefix stays empty

**`src/utils/invoicePdfGenerator.ts`** (lines 708, 711)
- Same fix: change `|| 'RE NR:'` to `?? ''` so empty prefix is respected

**`src/components/invoices/components/InvoiceSettings.tsx`** (line 84)
- Change placeholder from `"RE NR:"` to `"e.g. INV-"` (cosmetic, just so it doesn't suggest RE NR)

**`src/pages/InvoiceDetail.tsx`**
- Initialize `templateSettings` state by reading from localStorage (same source as `useInvoiceSettings`) so the parent doesn't start with stale defaults
- In `handleSave`, also persist the current `templateSettings` to localStorage so edits in Template Settings tab are saved when the user hits Save

**`supabase/functions/generate-monthly-installments/index.ts`** (line 98)
- Change `prefix_param: "RE NR"` to `prefix_param: "INV"` to match the standard format

