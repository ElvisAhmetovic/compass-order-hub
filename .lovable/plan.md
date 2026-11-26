# Get automatic invoice reminders sending again

## What is wrong (confirmed)
- The automatic invoice reminder job runs every 15 minutes, and since my last security change it gets turned away every time.
- I checked the job: it signs in with the public website key, not the private server key or an admin login. The new check only lets those two in.
- So no automatic invoice payment reminders have gone out since that change. Reminders sent by hand and through the Assistant still work.

## Fix
1. Give the scheduled job its own private pass so it can prove it's the real scheduler. It gets a new random secret that only the server and the scheduler know.
2. The reminder function accepts that pass, as well as the server key and signed-in admins as before. Anyone else is still turned away.
3. Start the reminder job again with the new pass, on the same 15-minute schedule (96 runs a day, as today).
4. Check that the next run finishes without errors, and that invoices that are due get their reminder. No invoice will get two reminders, because the normal "next reminder" date still applies.

Missed reminders are not sent all at once. Overdue invoices just get picked up on the next runs as normal.

## Technical details
- New secret `REMINDER_CRON_SECRET`, created with the generate-secret tool. The same value goes into Supabase Vault (`vault.create_secret`) so the cron command can read it with `vault.decrypted_secrets` at run time. It is never written as text into the job.
- `requireReminderCaller`: also accept the `x-cron-secret` header when it exactly matches `REMINDER_CRON_SECRET`, compared in constant time.
- Migration: `cron.unschedule('send-invoice-payment-reminders')`, then reschedule it with the header taken from Vault.
- Deno tests: correct cron secret passes, wrong or missing secret gives 401, public key alone gives 401. Existing scheduler/admin tests stay.
- Redeploy `send-invoice-payment-reminders`, then confirm the next run returns 200 in `net._http_response`.
- Resolve the monitoring finding as fixed.
- Side note, no change in this plan: the order-reminder and follow-up-reminder jobs also send the public key. Those functions don't have the new check, so they still run.
