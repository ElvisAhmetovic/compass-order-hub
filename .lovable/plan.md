# Cancel the invoice when an order is cancelled

When someone marks an order as Cancelled, the invoice attached to that one order should be cancelled too, so it stops going out to the client. Turning the cancellation off again brings the invoice back.

## What changes

When an order is set to **Cancelled**:
- Any unpaid invoice linked to that order (draft, sent, overdue, partially paid) is marked **Cancelled**.
- Its reminder schedule is cleared, so no further payment reminders are sent.
- Any still-scheduled reminders for that order are cancelled as well.
- Invoices that are already **paid** or **refunded** are left exactly as they are.

When the **Cancelled** mark is removed from that order:
- Invoices that were cancelled by this automation go back to **Sent** if the order is marked Invoice Sent, otherwise **Draft**.
- If they go back to Sent, the normal reminder schedule is set again (business hours, weekdays, the invoice's own interval).
- Invoices someone cancelled manually for other reasons are not touched.

Only the invoice(s) attached to that specific order are affected. Nothing else in the system changes.

## Technical notes

- `src/services/orderService.ts`, in the `status === "Cancelled"` branch of the status-toggle flow (currently only clears `next_reminder_at`):
  - On enable: select linked invoices by `order_id`, and for those with status in `draft/sent/overdue/partially_paid` call `sync_invoice_status` (security-definer RPC, avoids RLS surprises) with `cancelled` and `next_reminder_at = null`. Also set `payment_reminders.status = 'cancelled'` for rows of that order still `scheduled`.
  - On disable: restore only invoices that were auto-cancelled, using the existing `auto_cancelled_by_order` marker described below; target status `sent` when `status_invoice_sent` is true, else `draft`; recompute `next_reminder_at` with the existing `nextReminderForInvoice` helper when going to `sent`.
- To tell auto-cancelled invoices apart from manual ones, add a nullable boolean column `auto_cancelled_by_order` on `public.invoices` (default false) via migration; set true on auto-cancel, false on restore.
- The unique index on `invoices.order_id` excludes cancelled invoices, so a replacement invoice can still be created for a cancelled order — no change needed there.
- Log every transition through the existing invoice audit service so the change is traceable.
- Reminder edge functions already skip cancelled orders; this change makes the invoice record itself reflect reality too.
