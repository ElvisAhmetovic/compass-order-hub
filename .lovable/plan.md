## Why the PDF always shows "Tax (21%)"

In `src/utils/invoicePdfGenerator.ts` line 783, the tax label is hardcoded with a fallback:

```ts
<span>${getTranslatedText('tax')} (${templateSettings.vatRate || 21}%):</span>
```

Two problems:

1. **Wrong source**: It reads `templateSettings.vatRate` (the global template setting), not the actual VAT rate used on the invoice's line items. When generating a PDF for a saved invoice, `templateSettings.vatRate` is often missing/0, so it falls back to **21**.
2. **Hardcoded fallback**: `|| 21` means any falsy value (0, undefined, null) becomes 21 — even when VAT is set to 0% legitimately.

Meanwhile the actual `vatAmount` (line 187–192) is correctly computed from each line item's own `vat_rate`. So the *amount* is right but the *label* lies.

## Fix

Derive the displayed VAT % from the line items themselves so the label always matches reality.

### Change in `src/utils/invoicePdfGenerator.ts`

1. In `calculateTotals` (around line 182), also compute an effective VAT rate:
   - If all line items share the same `vat_rate`, use that single rate (e.g. `10%`).
   - If items use mixed rates, show the blended/effective rate: `vatAmount / subtotal * 100`, rounded to 2 decimals.
   - If `subtotal` is 0, fall back to `0`.
2. Replace the hardcoded `templateSettings.vatRate || 21` on line 783 with that computed rate.
3. Format it cleanly (strip trailing `.00` so `20%` shows as `20%`, not `20.00%`).

### Result

- Invoice with all items at 0% VAT → "Tax (0%)"
- Invoice with all items at 19% → "Tax (19%)"
- Mixed rates (e.g. 19% + 7%) → shows the effective blended rate matching the displayed amount

### Out of scope

- The line items table, the `vatAmount` math, currency formatting, and template settings all stay as-is.
- No backend, RLS, or schema changes.

One file, one small function tweak, one string interpolation change.
