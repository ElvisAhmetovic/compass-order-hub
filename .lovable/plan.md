

## Make Bank Account Numbers Larger and Bold Black

The bank details (IBAN, BIC, BLZ, Account, Bank values) are currently small and gray, making them hard to read. The fix makes the actual account numbers larger and bold black in both the preview component and the PDF generator.

### Changes

**1. `src/components/invoices/InvoicePreview.tsx` (lines 669-672)**
- Make account values (`account.iban`, `account.bic`, etc.) use `text-black font-bold text-base` so the numbers stand out clearly against the labels.

**2. `src/utils/invoicePdfGenerator.ts` (lines 818-821)**
- Apply `font-weight: bold; color: #000; font-size: 13px;` to the account number values in the PDF HTML template, matching the preview styling.

Both files get the same visual treatment: labels stay as-is, but the actual numbers (IBAN value, BIC value, etc.) become larger, bold, and black.

