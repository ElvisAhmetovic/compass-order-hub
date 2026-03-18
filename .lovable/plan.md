

## Fix: Keep Both Triggers for Invoice Payment Reminders

### Current State
The status change to "sent" (via order toggle or Invoices page dropdown) already sets `next_reminder_at` to +2 days. The user wants to **keep this** AND also add the manual send buttons as additional triggers.

### What Changes
The existing status-based scheduling stays as-is. We additionally set `next_reminder_at` when a team member manually sends an invoice via the send dialogs (in case the status wasn't changed first). We also change the interval from 2 days to 24 hours everywhere.

### Changes

**`src/components/invoices/SendInvoiceDialog.tsx`** (~line 111-123)
- After firing the email, update the invoice: set `next_reminder_at` to `now + 24h` (if not already set) and status to `sent` if still `draft`

**`src/components/invoices/SendInvoicePDFDialog.tsx`** (~line 72-84)
- Same: after sending, set `next_reminder_at` to `now + 24h` and status to `sent`

**`src/pages/Invoices.tsx`** (~line 122-127)
- Change interval from 2 days to 24 hours: `Date.now() + 24 * 60 * 60 * 1000`

**`src/services/orderService.ts`** (~line 742)
- Change interval from 2 days to 24 hours: `Date.now() + 24 * 60 * 60 * 1000`

**`supabase/functions/send-invoice-payment-reminders/index.ts`** (~lines 283, 260)
- Change next reminder interval from 2 days to 24 hours

