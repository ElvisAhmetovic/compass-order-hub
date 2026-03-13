

## Fix: Client selector text overflowing

The Client dropdown button shows `{name} - {email}` which can be very long. The button text overflows past the field boundary because there's no text truncation.

### Fix
In `src/pages/InvoiceDetail.tsx` line 621, add `overflow-hidden text-ellipsis whitespace-nowrap` to the Button so the text truncates with an ellipsis instead of overflowing. Wrap the text in a `<span>` with `truncate` class to ensure proper clipping while keeping the chevron icon visible.

### File
- `src/pages/InvoiceDetail.tsx` — line 621-625: add truncation to the combobox trigger button

