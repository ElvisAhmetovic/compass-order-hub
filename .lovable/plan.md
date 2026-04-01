

## Fix: Enable Automatic Payment Reminders for Monthly Package Invoices

### Problem
When the `generate-monthly-installments` edge function creates and sends invoices on the 1st of each month, it sets `status: 'sent'` but **never sets `next_reminder_at`**. This means the automated payment reminder system (which checks for `next_reminder_at <= now()`) never picks up these invoices — they never get follow-up reminders.

Today's batch (INV-2026-524 through INV-2026-543, ~20 invoices) all have this issue.

### Fix

**1. Edge function fix — `supabase/functions/generate-monthly-installments/index.ts`**
- In the `createInvoice` function (line 364-377), add `next_reminder_at` set to 48 hours from creation time, matching the same pattern used everywhere else in the system
- Change the insert to include: `next_reminder_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()`

**2. Database fix — activate reminders on recent monthly invoices**
- Run a one-time migration to set `next_reminder_at` for all existing invoices that are `status = 'sent'` and `next_reminder_at IS NULL` and `order_id IS NULL` (monthly invoices don't have an order_id)
- Set them to 48 hours from now so reminders start flowing

### Files to modify
1. `supabase/functions/generate-monthly-installments/index.ts` — Add `next_reminder_at` to invoice insert
2. Database migration — Backfill `next_reminder_at` for existing monthly invoices

