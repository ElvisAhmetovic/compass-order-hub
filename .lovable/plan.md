

## Editable Invoice Year & Number with Auto-Sequencing

### Overview
Add editable "Year" and "Invoice Number" fields to the edit invoice section. The displayed invoice number becomes `INV-{year}-{number}`. When manually set, the system updates the sequence so the next auto-generated invoice continues from there.

### Database Changes

**Modify `generate_invoice_number` function** to accept optional `year_param` and `sequence_param` parameters. When both are provided, it sets the sequence to that value (so next auto invoice = sequence + 1). The function already uses the `invoice_sequences` table with `(year, prefix)` uniqueness.

**New SQL:**
```sql
CREATE OR REPLACE FUNCTION generate_invoice_number(
  prefix_param text DEFAULT 'INV',
  year_param integer DEFAULT NULL,
  sequence_param integer DEFAULT NULL
) RETURNS text ...
```
When `sequence_param` is provided, upsert `last_sequence = sequence_param` instead of incrementing.

### Frontend Changes

**`src/pages/InvoiceDetail.tsx`**
1. Default `invoiceNumberPrefix` to `'INV-'` (line 62, change from `''`)
2. Add state for `invoiceYear` and `invoiceSeqNumber` (parsed from existing `invoice.invoice_number` for existing invoices)
3. Add two input fields (Year + Invoice Number) in the Invoice Details card, above the client selector
4. On save for new invoices: call `generate_invoice_number` with the custom year/sequence params, or let it auto-generate if fields are empty
5. On save for existing invoices: update `invoice_number` field to `INV-{year}-{paddedSeq}` and update the sequence table
6. Pass the composed invoice number to preview and PDF via the existing `invoice` object / templateSettings

**`src/services/invoiceService.ts`**
- Update `createInvoice` to accept optional `year` and `sequence` params, passing them to the RPC call
- Add method `updateInvoiceNumber` to update both the invoice record and the sequence table

**`src/components/invoices/InvoicePreview.tsx`** and **`src/utils/invoicePdfGenerator.ts`**
- Already use `invoice.invoice_number` with prefix — no changes needed if we compose the number correctly before passing it

### Flow
1. User opens new invoice → Year defaults to current year, Number is blank (auto)
2. User types 2026 / 430 → on save, invoice_number = `INV-2026-430`, sequence table updated to `last_sequence = 430`
3. Next new invoice with no manual input → auto-generates `INV-2026-431`
4. For existing invoices, changing year/number updates the invoice_number and syncs the sequence

