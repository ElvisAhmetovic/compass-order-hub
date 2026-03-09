

## Two Fixes: Default Line Item + Intuitive VAT Input

### 1. Always start with one line item
For new invoices, after loading completes and `lineItems` is empty, automatically add one blank line item so the user doesn't have to click "Add Item" every time.

**File: `src/pages/InvoiceDetail.tsx`** — In `loadData`, after the new-invoice branch (when `isNewInvoice` is true and no line items exist), call `addLineItem()` or directly set a default item in state.

### 2. Fix VAT % input to be intuitive
Currently the VAT field stores a decimal (e.g. `0.19`) but the input displays `(vat_rate * 100).toFixed(2)` which shows "19.00". The `.toFixed(2)` reformats on every keystroke, making it nearly impossible to type a value like "19".

**Fix in `src/components/invoices/LineItemRow.tsx`**:
- Remove the `* 100` / `/ 100` conversion — instead, store and display VAT as a whole-number percentage (e.g. `19` means 19%)
- Use a simple `value={item.vat_rate}` display with no `.toFixed()` formatting while editing
- Move the decimal conversion to calculation time only (where `line_total` is computed)

**Wait** — the `vat_rate` is stored as decimal in the DB and used in calculations elsewhere. Changing storage would be risky. Better approach:

- Use a **local display value** pattern: show the input as a plain text field that the user types whole numbers into (like "19"), and only convert to decimal on blur or on change
- Remove `.toFixed(2)` from the `value` — instead use `String(item.vat_rate * 100)` which gives "19" not "19.00", so typing is natural
- Same fix for `discount_rate`

**File: `src/components/invoices/LineItemRow.tsx`** (lines 121-137):
- Change VAT `value` from `(item.vat_rate * 100).toFixed(2)` → `item.vat_rate * 100` (number input handles display)
- Change discount `value` similarly
- Change `step` from `"0.01"` to `"1"` for whole-percentage steps

### Files to modify
- `src/pages/InvoiceDetail.tsx` — add default line item for new invoices
- `src/components/invoices/LineItemRow.tsx` — fix VAT/discount input display

