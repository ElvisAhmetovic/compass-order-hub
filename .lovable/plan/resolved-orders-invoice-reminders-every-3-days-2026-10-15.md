# Resolved orders: invoice reminders every 3 days

## Goal
Normal invoices keep the 7-day reminder rhythm. As soon as an order is marked **Resolved**, its linked unpaid invoice switches to a reminder every **3 days**.

## Behaviour
- Order marked Resolved, and its invoice is still unpaid (sent / overdue / partially paid), with reminders not paused and the client not opted out: interval becomes 72 hours. The next reminder moves to 3 days from now, or stays earlier if one was already due sooner.
- Every reminder after that is 3 days apart, until the invoice is paid or cancelled. Those stop reminders as they do today.
- Resolved is un-ticked: the invoice goes back to 7 days.
- Paid, cancelled or draft invoices are not touched.
- The interval can still be changed by hand per invoice in the reminder window.
- Existing orders already marked Resolved with unpaid invoices: switched to 3 days once, when this goes live. I will report how many.

## Technical details
- Migration: a trigger on `orders` (AFTER UPDATE OF status_resolved) updates the linked `invoices` row (by `order_id`) to set `reminder_interval_hours = 72` and `next_reminder_at = LEAST(next_reminder_at, now()+72h)`. Un-resolving sets it back to 168. The trigger works no matter which screen or button sets Resolved.
- One-time backfill for currently resolved and unpaid invoices.
- `send-invoice-payment-reminders` already uses `invoice.reminder_interval_hours`, so it needs no change.
- Add `RESOLVED_REMINDER_INTERVAL_HOURS = 72` in `src/utils/reminderInterval.ts` with a unit test (72 when resolved, 168 otherwise).
