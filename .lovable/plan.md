# Show the "paid on" date on paid invoices

## Goal
Whenever an invoice becomes **Paid**, however it happens (Confirm Payment button, order status change, recorded payment, monthly package), the date it was marked paid is saved. That date appears just above the green Paid status in the invoice list and on the invoice detail page.

## What changes
1. **Save the date automatically.** Invoices get a new "paid on" date. A database rule fills it in when an invoice's status changes to Paid, and clears it if the invoice goes back to unpaid or cancelled. This covers every path, because it happens in the database itself.
2. **Fill in older paid invoices.** For invoices that are already paid, use the best date we have: the most recent recorded payment date. If there isn't one, use the invoice's last-updated date. Those dates are estimates.
3. **Show it.** In the invoice list, a small line such as "Paid 27.10.2026" sits above the Paid badge. Hovering over it shows the time. The invoice detail page shows the same date next to its status. This works like the cancelled X display.
4. **Monthly packages.** Monthly installments already save a paid date. Their invoice list rows will show it the same way.

## Technical details
- Migration: `ALTER TABLE invoices ADD COLUMN paid_at timestamptz`. Add a BEFORE UPDATE/INSERT trigger: set `paid_at = now()` when status becomes `paid` and paid_at is null, and set it to null when status leaves `paid`. Backfill from `max(payments.payment_date)`, falling back to `updated_at`.
- UI: `src/pages/Invoices.tsx` status cell, plus the status area of the invoice detail page. Use de-DE date formatting.
- Add a small test for the date-label helper.
