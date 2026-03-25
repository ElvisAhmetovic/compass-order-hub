

## Fix: Payment Reminder Sent After Invoice Marked as Paid

### Root Cause
The database trigger `update_invoice_status_on_payment` changes the invoice status to 'paid' when a payment is recorded, but it does **NOT** clear the `next_reminder_at` field. While the cron function filters by `status IN ('sent', 'overdue')`, there's a timing gap: if the cron picks up the invoice in the same moment the payment is being processed, or if any other code path re-sets the status without clearing `next_reminder_at`, a reminder slips through.

Additionally, the DB trigger is the only path that updates invoice status without clearing `next_reminder_at` — all other paths (Invoices page, OrderService sync) properly set it to `null` on 'paid'.

### Fix (2 changes)

**1. Database migration — Update `update_invoice_status_on_payment` trigger function**
Add `next_reminder_at = NULL` when status becomes 'paid' or 'partially_paid' (neither should receive automated reminders):

```sql
UPDATE public.invoices
SET 
  status = CASE 
    WHEN total_paid >= invoice_total THEN 'paid'
    WHEN total_paid > 0 AND total_paid < invoice_total THEN 'partially_paid'
    ELSE status
  END,
  next_reminder_at = CASE 
    WHEN total_paid >= invoice_total THEN NULL
    ELSE next_reminder_at
  END,
  updated_at = NOW()
WHERE id = NEW.invoice_id;
```

**2. Edge function safety check — `send-invoice-payment-reminders/index.ts`**
Add a re-fetch check before sending each reminder to confirm the invoice is still 'sent'/'overdue' (guards against race conditions):

```typescript
// Before sending, re-verify status hasn't changed
const { data: freshInvoice } = await supabase
  .from("invoices")
  .select("status")
  .eq("id", invoice.id)
  .single();

if (!freshInvoice || !['sent', 'overdue'].includes(freshInvoice.status)) {
  console.log(`Skipping invoice ${invoice.invoice_number} - status changed to ${freshInvoice?.status}`);
  continue;
}
```

This double-guard ensures no reminder is ever sent for a paid/cancelled invoice, regardless of how the status was changed.

