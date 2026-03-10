

## Fix: Show Auto-Generated Invoice Number in Preview for New Invoices

### Problem
When creating a new invoice, `invoice` is `null`, so the preview receives `null` and shows no invoice number. The custom number logic only applies when `invoice` already exists.

### Fix

**`src/pages/InvoiceDetail.tsx`** — Two places to update:

1. **Preview component (line 854)**: When `invoice` is `null` (new invoice), construct a temporary invoice-like object with a preview number:
   - If year+seq are filled: show `INV-{year}-{paddedSeq}`
   - Otherwise: show `INV-{currentYear}-###` as placeholder

2. **PDF download (line ~476)**: Same logic — construct a temporary object when `invoice` is null.

Both the `InvoicePreview` prop and the PDF generation function will receive a constructed object instead of `null`, showing the user what the invoice number will look like.

