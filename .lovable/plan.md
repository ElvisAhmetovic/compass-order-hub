# Reverse-calc Netto when VAT is changed after Total

## Problem

In `src/pages/InvoiceDetail.tsx` the line-item updater already supports reverse-calc when the user edits `line_total` (brutto):

```
unit_price = brutto / quantity / (1 - discount) / (1 + vat)
```

But if the colleague enters **Total = 50** first and **then** sets **VAT = 19%**, the `else` branch fires and forward-calculates a new `line_total` (50 × 1.19 = 59.50), overwriting the 50 they typed. Same thing happens if they change quantity or discount afterwards. So the "backwards" logic only works if the typing order is perfect — which is why it feels broken.

## Fix

Treat **Total (brutto)** as the anchored value once the user has entered it. When `vat_rate`, `quantity`, or `discount_rate` changes and a non-zero `line_total` already exists, reverse-calc `unit_price` from that existing brutto instead of forward-calculating a new brutto.

Only one file changes: `src/pages/InvoiceDetail.tsx`, inside the `updateLineItem` function (around lines 285–315).

### New logic (pseudocode)

```text
if field === 'line_total':
    // explicit brutto edit → reverse-calc Netto (existing behavior)
    currentItem.line_total = value
    currentItem.unit_price = brutto / qty / (1 - discount) / (1 + vat)

else if field in ['vat_rate', 'quantity', 'discount_rate'] AND currentItem.line_total > 0:
    // Total is anchored → keep brutto, re-derive Netto
    currentItem[field] = value
    currentItem.unit_price = line_total / qty / (1 - discount) / (1 + vat)

else:
    // unit_price edited, or no brutto yet → forward-calc (existing behavior)
    currentItem[field] = value
    currentItem.line_total = qty * unit_price * (1 - discount) * (1 + vat)
```

Guard against division by zero (qty > 0, vatMultiplier > 0, discountMultiplier > 0); fall back to current forward-calc behavior in that case. Round `unit_price` to 2 decimals as today.

### Result

- Enter Total 50, then VAT 19% → unit_price becomes 42.02, Total stays 50.
- Enter unit_price 42.02, then VAT 19% with empty Total → Total fills to 50.02 (forward-calc, unchanged behavior).
- Editing Total at any time still reverse-calculates Netto (unchanged behavior).

No other files, no DB changes, no PDF/preview changes needed — totals are derived from the same fields downstream.
