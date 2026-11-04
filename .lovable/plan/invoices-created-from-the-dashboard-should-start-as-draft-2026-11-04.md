# Invoices created from the dashboard should start as Draft

## What happens today

When you tick "Invoice Sent" on an order in the dashboard, the app creates the invoice and immediately marks it **Sent**, even though no email went to the client. It also schedules payment reminders for it. That means a client could get a "please pay" reminder for an invoice they never received.

Invoices created manually on the Invoices page start as **Draft** and only become **Sent** when you actually email them.

## Change

- Ticking "Invoice Sent" on an order creates the invoice as **Draft**, with no reminders scheduled.
- The invoice becomes **Sent** (and reminders start) only when someone actually sends it with the Send button. This already works for manually created invoices and already ticks "Invoice Sent" on the linked order.
- Ticking "Invoice Paid" on an order still creates or marks the invoice as **Paid**, as now.
- Unticking stays as it is now.
- Existing invoices are not touched.

## Open question

The order will show "Invoice Sent" while its invoice is still a Draft until someone emails it. If you'd rather the order tick only once the invoice is really emailed, tell me and I'll change that too. if you think its a good thing to do then do it sure 

## Technical details

- `src/components/dashboard/OrderActions.tsx` (around line 175): for "Invoice Sent", leave the new invoice as `draft` and skip the status update; keep `paid` for "Invoice Paid".
- `src/services/orderService.ts` `toggleOrderStatus` (around line 926): when "Invoice Sent" is turned on, don't upgrade a linked `draft` invoice to `sent` and don't set `next_reminder_at`. Leave the invoice as it is. Handle paid/unticked the same way as now.
- Add a small test that creating from "Invoice Sent" produces a draft with no reminder date, and "Invoice Paid" produces paid.