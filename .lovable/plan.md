

## Fix VAT Rate Scale Inconsistency

### Problem
Two different VAT rate scales are used:
- **Template settings** (`useInvoiceSettings.ts`): stores as percentage integer (`21`)
- **Line items** (`InvoiceDetail.tsx`): stores as decimal (`0.19`)
- **Preview/PDF display**: shows `templateSettings.vatRate` directly as `21%`, which only works with the integer format

The line items and template settings are independent — line items default to `0.19` regardless of what the template settings say. The standard German VAT rate of 19% should be the default everywhere.

### Changes

**`src/components/invoices/hooks/useInvoiceSettings.ts`** (line 49)
- Change default `vatRate` from `21` to `19`

**`src/pages/InvoiceDetail.tsx`**
- Line 45: Change `vatRate: 0.19` to `vatRate: 19` — normalize template settings to percentage format (matching how it's displayed in the UI and PDF)
- Line 150: Change default `vat_rate: 0.19` to `vat_rate: 0.19` — keep at 0.19 (19% as decimal), since line items use decimal internally and the `LineItemRow` component converts to/from percentage for display

Actually, the real inconsistency is that `InvoiceDetail.tsx` line 45 sets `vatRate: 0.19` in `templateSettings`, but the preview and PDF display it as `${templateSettings.vatRate}%` — showing "0.19%" instead of "19%". Meanwhile `useInvoiceSettings` defaults to `21` which displays correctly as "21%".

### Normalized approach
- **Template settings `vatRate`**: always store as percentage integer (19, 21, etc.) — this is what the UI input and display expect
- **Line item `vat_rate`**: always store as decimal (0.19, 0.21, etc.) — this is what the calculation logic expects
- Default both to 19% (German standard)

### File changes

1. **`src/components/invoices/hooks/useInvoiceSettings.ts`** (line 49): `vatRate: 21` → `vatRate: 19`

2. **`src/pages/InvoiceDetail.tsx`** (line 45): `vatRate: 0.19` → `vatRate: 19` (was incorrectly using decimal format for template settings display)

3. **`src/pages/InvoiceDetail.tsx`** (line 150): keep `vat_rate: 0.19` (correct decimal for line item calculations)

4. **`src/components/dashboard/OrderActions.tsx`** (line 126, 143): keep `vat_rate: 0.19` (correct decimal for line items)

This is a two-line fix: change the default vatRate in `useInvoiceSettings` from 21→19, and fix the scale in `InvoiceDetail.tsx` templateSettings from 0.19→19.

