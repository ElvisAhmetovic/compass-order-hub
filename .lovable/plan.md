

## Fire-and-Forget Email Sending

### Problem
When sending invoices, the modal stays in a loading/disabled state while the edge function processes emails (including team notifications with rate-limit delays). The user is blocked from continuing to use the site.

### Solution
In both `SendInvoicePDFDialog` and `SendMonthlyInvoiceDialog`, after generating the PDF locally, fire off the edge function call without awaiting it. Immediately show the success toast, close the modal, and let the email delivery happen in the background.

### Changes

**`src/components/invoices/SendInvoicePDFDialog.tsx`** — In `handleSend`:
- Keep the `setSending(true)` and PDF generation (those are fast, local operations)
- After `generateInvoicePDFBase64` completes, call `supabase.functions.invoke(...)` **without awaiting it** — just fire and forget with a `.catch()` for error logging
- Immediately show success toast, close dialog, and `setSending(false)`

**`src/components/monthly/SendMonthlyInvoiceDialog.tsx`** — Same pattern in `handleSend`:
- Keep all the sync operations (auto-create client, auto-create invoice, generate PDF, update installment status) as awaited
- Only the final `supabase.functions.invoke("send-invoice-pdf", ...)` becomes fire-and-forget
- Immediately show success toast and close

**`src/components/invoices/SendInvoiceDialog.tsx`** — Same pattern in `handleSendEmail`:
- Fire off `EmailService.sendInvoiceEmail(...)` without awaiting, show success immediately

