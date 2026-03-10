

## Make Line Item Total (Brutto) Editable — Reverse-Calculate Netto Price

### What changes

The "Total" column in line items becomes an editable input instead of read-only text. When the user types a brutto (gross) amount there, the system back-calculates the `unit_price` (netto) based on the current VAT %, discount %, and quantity.

**Formula:** `unit_price = brutto / quantity / (1 - discount_rate) / (1 + vat_rate)`

When VAT or discount changes, `line_total` is recalculated from `unit_price` as it already does (forward calculation). But when `line_total` is edited directly, we reverse-calculate `unit_price`.

### Files

**`src/components/invoices/LineItemRow.tsx`**
- Replace the read-only `formatCurrency(item.line_total)` div with an editable `<Input type="number">` 
- On change, call `onUpdate(index, 'line_total', value)` — the parent handles the reverse math

**`src/pages/InvoiceDetail.tsx`** (the `updateLineItem` function, ~line 263)
- Add a special case: when `field === 'line_total'`, reverse-calculate `unit_price`:
  ```
  unit_price = line_total / quantity / (1 - discount_rate) / (1 + vat_rate)
  ```
  Handle edge cases (quantity=0 → set unit_price to 0, etc.)
- For all other fields, keep the existing forward calculation as-is

