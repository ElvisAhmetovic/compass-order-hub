# QA: Per-invoice reminder interval

## What I verified (read-only)

- **Database**: `invoices.reminder_interval_hours` exists, integer, nullable, default `48`. All 906 existing invoices have the value `48` — no nulls, so no legacy invoice is left without a cadence.
- **Edge function** (`send-invoice-payment-reminders`): loads invoices with `select("*, client:clients(*)")`, so the new column is included, and schedules the next run with `invoice.reminder_interval_hours || 48`. Correct fallback if a row is ever null.
- **Send flow** (`SendInvoiceDialog`): now reads `reminder_interval_hours` and seeds the first `next_reminder_at` from it instead of the hardcoded 48h.
- **UI** (`InvoiceReminderHistory`): `loadInterval()` runs on dialog open, the control renders only for unpaid invoices, hours/days toggle converts correctly (days x 24), save validates 1 hour to 30 days and writes the column.

## Gap: no end-to-end write test yet

Everything above is static/structural. What is still unproven is the live round trip, and testing it requires writing to the database, which I do not do in plan mode.

## Proposed QA run (needs approval)

1. Open a real unpaid invoice's reminder dialog in a headless browser, screenshot the interval control.
2. Set the interval to `2 days`, save, confirm the toast and the "Current:" text updating to `2 day(s)`.
3. Re-query the invoice row to confirm `reminder_interval_hours = 48 -> 48`... i.e. that the stored value is exactly `48` for 2 days (2 x 24), not the raw `2`.
4. Reload the dialog to confirm it re-hydrates as `2 / Days` and not `48 / Hours`.
5. Invoke the reminder cron function against a due test invoice and confirm the newly written `next_reminder_at` sits at the custom interval from now, not 48h.
6. Restore the test invoice's original values afterwards.

If you would rather not touch live invoice data, I can run steps 1, 2 and 4 against a throwaway test invoice only, and verify step 5 by reading the function logs after the next scheduled run instead.
