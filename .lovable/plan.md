# Fix remaining 48-hour reminder schedules (7-day default not applied everywhere)

## What actually happened with Sievers Bestattungen GmbH

Confirmed from the database:

- Invoice INV-2026-1410 was created Fri **Aug 21, 13:55 UTC**.
- Its `reminder_interval_hours` is **168** (7 days) — the new default is stored correctly.
- But `next_reminder_at` was set to **Aug 23, 14:00** — exactly **48 hours** after creation.
- The cron fired at that time and sent reminder #1 on Saturday to `info@bestattungen-sievers.de`.
- The *next* reminder is correctly scheduled for Aug 30 (7 days), because the edge function already uses 168.

So the earlier fix covered the *repeat* interval and two dialogs, but the **first** reminder is still scheduled +48h by several other code paths that hardcode 48 hours and ignore `reminder_interval_hours`.

## Confirmed places still hardcoding 48 hours

- `src/services/orderService.ts` (two spots): when an order flips to "Invoice Sent", it syncs the invoice with `next_reminder_at = now + 48h`. This is the path that produced the Sievers schedule.
- `src/pages/Invoices.tsx`: status change to `sent` sets +48h.
- `src/components/invoices/SendInvoicePDFDialog.tsx`: +48h.
- `src/components/monthly/SendMonthlyInvoiceDialog.tsx`: +48h.
- `src/components/monthly/MonthlyInstallmentsTable.tsx` (three spots): +48h.
- `supabase/functions/generate-monthly-installments/index.ts`: +48h.

Already correct: `SendInvoiceDialog.tsx`, `InvoiceReminderHistory.tsx`, and the `send-invoice-payment-reminders` edge function.

## Changes

1. **Single source of truth for the default.** Add a shared constant (e.g. `DEFAULT_REMINDER_INTERVAL_HOURS = 168`) plus a small helper that, given an invoice id, reads `reminder_interval_hours` and returns `now + interval` — so every path respects a per-invoice override and falls back to 7 days.
2. **Replace every hardcoded 48h** in the files listed above with that helper/constant. Where the invoice row is already loaded, use its `reminder_interval_hours`; otherwise fetch it in the same query that is already being made.
3. **Edge function** `generate-monthly-installments`: use 168 hours as the fallback for newly generated monthly invoices, redeploy.
4. **Backfill the currently-wrong schedules.** For invoices still in `sent`/`overdue` whose `next_reminder_at` was computed with 48h (i.e. `next_reminder_at - created_at` ≈ 48h and `reminder_count = 0`), re-schedule to `created_at + reminder_interval_hours`. Invoices whose reminder already went out (like Sievers) keep the correct Aug 30 next date — no double sending.
5. **Verification**: query the affected invoices before/after the backfill and confirm no `sent`/`overdue` invoice with `reminder_count = 0` has a `next_reminder_at` less than 7 days from creation; run lint, typecheck and the unit test suite.

## Note

Reminders can land on weekends because the cron runs every minute, every day. If you also want reminders to never send on Saturday/Sunday (push to Monday), say so and I will add that rule to the edge function as part of this work.
