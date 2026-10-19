# Stop monthly billing from running twice

## What I found
- The daily catch-up starts **once** at 09:00 UTC. The scheduler history shows a single start each day.
- The billing for each client still runs **twice**, about 0.2 seconds apart. On 17 October, every client (Håndværker Gruppen, Garage Noordzicht, 4M Immobilien, …) shows two runs at the same moment. On some days it's four (around 130 runs instead of about 66).
- So something between that single start and the billing repeats the request. The most likely cause is that the scheduler gives up waiting after 5 seconds while the catch-up takes about 100 seconds, and the hosting side then runs it again. That's **likely, not confirmed**: the hosting logs from those days are no longer available.
- Usually the second copy finds "already sent" and stops. But when a client is due for the first time that month, both copies can create an invoice, as happened with Auto Garage Jimmy.

## Fix
Fixing every possible trigger would be guesswork, so the fix makes the double run harmless, whatever its cause:

1. **The database refuses a second month.** Add a rule that a contract can only have one monthly entry per month. If a second copy tries, it's rejected before any invoice is created. Today's "claim first" check stays as a backup.
2. **Only one catch-up per day.** The catch-up records "ran today" as its first step. A second start the same day stops immediately, without contacting any client.
3. **The scheduler waits longer.** Raise the scheduler's waiting time from 5 seconds to 2 minutes, which removes the likely cause.
4. **One existing double entry.** One contract already has two entries for March 2027. I'll show you which one before removing the extra. Nothing has been billed for it yet.
5. **Check:** next morning's runs should show one run per client, not two. I'll compare the counts and report back.

## Technical details
- Migration: delete the duplicate `monthly_installments` row (contract 1aa6bb07…, due 2027-03-01, keep the oldest, only if it has no invoice), then add `UNIQUE (contract_id, due_date)`. Generator treats unique-violation (23505) as "skipped – already claimed".
- New table `monthly_billing_daily_locks(run_date date primary key, created_at)` with grants for service_role only plus RLS. Catch-up inserts today's Sarajevo date and exits on conflict. The manual "run catch-up" button passes `force=true` to bypass the lock.
- Reschedule cron job 7 via SQL insert with `timeout_milliseconds := 120000` in `net.http_post`; same for job 3.
- Redeploy `generate-monthly-installments` and `monthly-billing-catchup`.
