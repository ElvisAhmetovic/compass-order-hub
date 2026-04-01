

## Attach Invoice PDF to Team Notification Emails

### Problem
When monthly invoices are sent on the 1st, the team gets a notification email with just text (client name, invoice number, amount). But they don't get the actual invoice PDF attached — unlike how `send-invoice-pdf` works where team members get the full PDF copy.

### Fix

**File: `supabase/functions/generate-monthly-installments/index.ts`**

1. Update `sendTeamNotifications` signature to accept `pdfBase64: string` parameter
2. Add `attachments` array to each team email Resend call: `[{ filename: \`${invoiceNumber}.pdf\`, content: pdfBase64 }]`
3. Update both call sites (existing installment + new installment paths, lines ~822 and ~892) to pass `pdfBytes` (which is already the base64 PDF string generated right before)

That's it — the PDF is already generated at both call sites and stored in `pdfBytes`. We just need to thread it through to the team email function and attach it.

### Technical Details
- `pdfBytes` is already a base64-encoded PDF string (from `generateInvoicePDF`)
- Resend accepts `attachments: [{ filename, content }]` where content is base64
- Same pattern already used in `send-invoice-pdf` and the client email function
- Johan stays on this list (no exclusion for monthly team notifications per memory)

### Files to modify
1. `supabase/functions/generate-monthly-installments/index.ts` — Add PDF attachment to team emails

