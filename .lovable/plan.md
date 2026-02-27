

## Add Invoice Attachment to Client Payment Reminder

### Overview
Add a searchable invoice selector to the "Send Client Reminder" modal. When an invoice is selected, its PDF is generated and sent as an attachment alongside the payment reminder email.

### Changes

**1. New component: `src/components/orders/InvoiceAttachmentSelector.tsx`**
- Searchable dropdown that fetches invoices from the `invoices` table (with client info)
- Sorted by `created_at` descending, displays invoice number, client name, amount, date
- Search filters by invoice number or client name
- Shows selected invoice with a remove button
- Uses Popover + Command (cmdk) pattern matching existing `InventoryAutocomplete`

**2. Update `src/components/orders/SendClientReminderModal.tsx`**
- Add state for `selectedInvoice` and `invoicePdfBase64`
- Import and render `InvoiceAttachmentSelector` between the custom message and the info note
- When an invoice is selected, fetch its line items and template settings, then call `generateInvoicePDFBase64()` to generate the PDF in the background
- Show a loading indicator while PDF generates
- Pass `invoicePdfBase64` and `invoiceNumber` in the edge function request body

**3. Update `supabase/functions/send-client-payment-reminder/index.ts`**
- Add `invoicePdfBase64` and `invoiceNumber` to the request interface
- When `invoicePdfBase64` is provided, add an `attachments` array to the Resend `emails.send()` call for the client email (same pattern as `send-invoice-pdf`)
- Team notification email mentions that an invoice was attached

### Technical Details

- Reuse `generateInvoicePDFBase64` from `src/utils/invoicePdfGenerator.ts` (already used by `SendInvoicePDFDialog`)
- Need to fetch invoice template settings via `useInvoiceSettings` or direct query
- Invoice line items fetched via `InvoiceService` or direct Supabase query
- PDF is generated client-side as raw base64 string (no data URI prefix) — same approach as existing invoice send feature
- Resend attachment format: `{ filename: "invoice-XXX.pdf", content: base64Data }`

### Files Changed

| File | Change |
|------|--------|
| `src/components/orders/InvoiceAttachmentSelector.tsx` | New — searchable invoice picker |
| `src/components/orders/SendClientReminderModal.tsx` | Add invoice selector + PDF generation |
| `supabase/functions/send-client-payment-reminder/index.ts` | Accept and attach PDF to email |

