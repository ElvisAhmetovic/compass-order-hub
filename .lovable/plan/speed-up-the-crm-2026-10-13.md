# Speed up the CRM

## What the check found
- The servers are up and not overloaded: 32 connections, 2 active, nothing stuck or waiting.
- The database is 1.5 GB, but your business data (orders, invoices, clients) is only a few MB. About 1.48 GB is internal logs from the automatic background jobs:
  - the job run history: 770 MB
  - saved replies from the automatic email/reminder calls: 708 MB
  These logs are never cleaned up. The history is now so big that counting it timed out.
- Two background jobs run every minute, day and night (payment reminders and follow-up reminders). Each run writes more log rows and competes with your team for the database.
- Loading the orders list is the heaviest query: about 80 ms on average, with spikes up to 4 to 7 seconds. Those spikes match the background jobs and log growth.

## Fix
1. Delete background-job logs older than 3 days (about 1.4 GB). No orders, invoices, clients or emails are touched.
2. Add a nightly cleanup job so these logs never pile up again.
3. Run the payment reminder and follow-up reminder jobs every 5 minutes instead of every minute. Reminders still go out on time, because they are scheduled in hours and days.
4. Make the orders list load only the fields the table shows, not every field of every order.
5. Measure again afterwards (database size, orders list speed, dashboard) and report the numbers.

## Technical notes
- Clean `cron.job_run_details` (start_time < now() - 3 days) and `net._http_response` (created < now() - 3 days) in batches, then VACUUM so the space is actually freed.
- New cron job `cleanup-job-logs` at 03:00 daily that runs the same deletes.
- Reschedule `send-payment-reminders-cron` and `send-follow-up-reminders` from `* * * * *` to `*/5 * * * *`.
- Orders list `select('*')` changes to an explicit column list. Detail views keep loading the full order.
