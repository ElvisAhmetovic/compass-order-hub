## Why "Tax (21%)" still shows after the previous fix

The previous fix only patched the **PDF generator** (`src/utils/invoicePdfGenerator.ts`). But the screenshot you sent is from the **on-screen invoice preview** — a separate component (`src/components/invoices/InvoicePreview.tsx`) that has the exact same bug on line 637:

```tsx
<span>{getTranslatedText('tax')} ({templateSettings.vatRate || 21}%):</span>
```

It reads `templateSettings.vatRate` (the global template setting, often missing/0) instead of the actual `vat_rate` on the line items, then falls back to a hardcoded `21`. The math next to it is correct (€441.37 / €2323.00 = 19%), proving the line items use 19% — only the label lies.

Also, the regex I used in the PDF fix (`/\.?0+$/`) accidentally strips trailing zeros from whole numbers (e.g., `20` → `2`, `0` → empty). That needs to be safer.

## Fix

### 1. `src/components/invoices/InvoicePreview.tsx`
- In `calculateTotals` (line ~26), also derive an `effectiveVatRate` from the line items:
  - If all items share the same `vat_rate`, use it directly
  - Otherwise, blended rate = `vatAmount / subtotal * 100`
  - If subtotal is 0 or VAT disabled, use 0
- Replace line 637's `templateSettings.vatRate || 21` with the derived rate, formatted cleanly (max 2 decimals, no fake trailing zero stripping that breaks `20` or `0`).

### 2. `src/utils/invoicePdfGenerator.ts` (small follow-up)
- Replace the unsafe `formattedVatRate` formatting (current `replace(/\.?0+$/, '')` corrupts `20` → `2`) with a safer formatter: only strip trailing zeros after a decimal point, never from the integer part. E.g. `19` → `"19"`, `19.5` → `"19.5"`, `19.50` → `"19.5"`, `20` → `"20"`, `0` → `"0"`.

### Result
- On-screen preview and downloaded PDF both show the real VAT % from the invoice's line items.
- 19% invoices show "Tax (19%)", 0% shows "Tax (0%)", 20% shows "Tax (20%)" (no truncation), mixed rates show the blended effective rate.

### Out of scope
- No changes to VAT math, currency formatting, line-items table, or template settings.
- No backend or DB changes.

Two files, two small tweaks.
