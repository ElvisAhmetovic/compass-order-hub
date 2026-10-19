# Auto Garage Jimmy: stop monthly invoices going out at weekends

## What I found
- **Payment reminders are not the problem.** They only go out Monday to Friday, 09:00–17:00 (Sarajevo time). In the last 30 days no reminder went out at a weekend, for Jimmy or anyone else.
- **The weekend email was a new monthly invoice.** On **Saturday 17 October at 11:00**, the automatic monthly billing created and sent Auto Garage Jimmy's new invoice. That job runs every day, weekends included.
- **It happened twice.** Two invoices, **INV-2026-1760** and **INV-2026-1761**, were created in the same second. Both are open, so the client probably got two invoice emails and will get two reminders.
- Both invoices have their first reminder set for Saturday 24 October. The weekday rule moves that to Monday 26 October.

## Changes
1. **Weekdays only for automatic monthly invoices.** If one falls due on a Saturday or Sunday, it's created and sent on Monday morning instead. Invoices you send by hand still go out whenever you click Send.
2. **Stop duplicates.** Before the monthly job creates an invoice, it checks whether one already exists for that client and month. If it does, it skips. I'll also find out why it ran twice; my guess is the daily job and the catch-up job overlapping, but I still have to confirm that.
3. **Clean up Jimmy.** You decide which of the two invoices to keep. I'll cancel the other one with no cancellation email to the client, so only one gets reminders. I'll also list any other clients who got a duplicate the same way.
4. **Check:** add an automatic check that a Saturday or Sunday moves to Monday, and run the existing checks.

## Technical details
- `supabase/functions/generate-monthly-installments/index.ts` and `monthly-billing-catchup/index.ts`: reuse the Europe/Sarajevo weekday gate from `send-invoice-payment-reminders` and exit early on Sat/Sun. Add an idempotency check on (contract/client, billing month) before insert, plus a unique index if the data allows.
- Diagnose the double run with the cron schedules and edge function logs from 17.10 at 11:00.
- Query for other pairs of invoices created within seconds of each other for the same client.
- Send no emails when cancelling the duplicate (`auto_reminders` path bypassed).
