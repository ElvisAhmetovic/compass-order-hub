# QA performance check: why the CRM feels slow

## Goal
Measure, not guess. Find out where the waiting time comes from: the browser, the network, the database or the background jobs. Then fix only what the numbers show.

## 1. Real page timings with a signed-in test account
A dedicated QA admin login already exists in the project settings. Open each main page in a test browser and record how long it takes until the content is visible, plus the number and size of downloads:
- Dashboard, Active Orders (each tab), Invoices, Invoice detail, Clients, Monthly Packages, Work Hours, Statistics/Rankings, Support tickets.
- Run each 3 times (first visit and repeat visits) and report the slowest steps.

## 2. Requests per page
For each page, list every server request: how many, how long each took, and which ran twice or more. Earlier logs show two small checks that ran about 155,000 times (team-member roles and today's work hours). Find which screen fires them so often and whether one shared check is enough.

## 3. Database health over time
- Re-run the slow-query report after today's cleanup and compare it with this morning's.
- Check speed at the team's busy hours (08:00 to 12:00 Sarajevo) against quiet hours.
- Confirm the nightly log cleanup ran and the database size stays small.
- Check whether the reminder jobs that run every minute line up with the slow moments.

## 4. Live site traffic
Check visitor and page-load data for the published site over the last 7 days. This shows whether slowness hits everyone or specific pages and times.

## 5. Browser side
- Check the downloaded app size per page, to catch pages that load the PDF, chart or editor tools when they don't need them.
- Check for screens that keep redrawing every second (clocks in the sidebar, the work-break banner) and cause lag on slower laptops.
- Run a test on a throttled "average laptop + office Wi-Fi" profile.

## 6. Report
A short table: page, time before and after, cause, proposed fix. Fixes are proposed for approval separately, nothing changes during the QA run.

## Technical notes
- Playwright with the QA_ADMIN_EMAIL / QA_ADMIN_PASSWORD login through the app's sign-in form. Capture `performance.getEntriesByType('navigation'|'resource')` and network events per route.
- Count duplicate REST calls per route (same table + filters within 5 s).
- `supabase--slow_queries` plus `pg_stat_statements` deltas; `analytics--read_project_analytics` hourly for the last 7 days.
- Bundle check from the Vite build manifest (chunk sizes per lazy route).
- Read-only: no code or data changes in this step.
