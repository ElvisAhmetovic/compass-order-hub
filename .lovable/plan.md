## What I found

Thomas Klein’s invoice creation is reaching the database successfully, but the insert fails with **409 Conflict** because the app generated `INV-2026-103`, and that invoice number already exists.

The invoice sequence row currently says the latest sequence is `1039`, but the invoice-number function pads with at least 3 digits only. That means sequence `103` becomes `INV-2026-103`, which can conflict with older invoices if the sequence was reset or manually overridden.

## Plan

1. **Fix the database invoice-number function**
   - Update `generate_invoice_number` so automatic numbering never returns an invoice number that already exists.
   - It will loop forward from the sequence until it finds a free number.
   - Keep manual custom invoice numbers supported, but make the sequence advance safely.

2. **Make invoice creation more resilient in the app**
   - In `InvoiceService.createInvoice`, if the insert fails specifically because `invoice_number` already exists, request the next invoice number and retry a few times instead of immediately showing the generic error.
   - Keep other errors unchanged so real permission/RLS problems still surface.

3. **Improve the error toast**
   - Replace the vague “Failed to create invoice” for duplicate-number conflicts with a clearer message if retries fail.

4. **Verify with current data**
   - Confirm `INV-2026-103` already exists.
   - Confirm the next generated invoice number skips conflicts and inserts successfully.

## Files / database touched

- Database migration: `public.generate_invoice_number(...)`
- `src/services/invoiceService.ts`

No changes to invoice UI layout are needed.