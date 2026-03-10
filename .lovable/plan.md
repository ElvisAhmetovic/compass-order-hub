

## Auto-Fill Next Invoice Number for New Invoices

### Problem
New invoices show `###` as placeholder instead of the actual next number (e.g., 431 if last was 430).

### Changes

**`src/services/invoiceService.ts`** — Add a static method `getNextSequenceNumber(year)`:
- Query `invoice_sequences` table for the given year/prefix `INV`
- Return `last_sequence + 1` (or 1 if no record exists)

**`src/pages/InvoiceDetail.tsx`** — In `loadData()`, when `isNewInvoice`:
- Call `InvoiceService.getNextSequenceNumber(currentYear)`
- Set `invoiceSeqNumber` to the returned value
- This makes the preview, PDF, and send-to-client all show the correct next number (e.g., `INV-2026-431`)
- The user can still override it manually

**Preview/PDF/Send** — Already use `invoiceYear` and `invoiceSeqNumber` to compose the number, so once these are pre-filled, everything works: preview shows `INV-2026-431`, PDF generates with it, and send-to-client uses it. The dashboard "create invoice" button, client button, and monthly packages all navigate to `/invoices/new` which hits the same `InvoiceDetail` page — so all entry points are covered.

