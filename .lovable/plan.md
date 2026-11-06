# Smarter AI Outreach: full client picture, monthly runs, own test inbox, Services knowledge base

## 1. AI reads the whole client history
For each client, the AI gets everything we already store, not just the service and price:
- Every order: description, internal notes, status, price, dates, assigned team member.
- Every invoice: paid, open, overdue, cancelled, and amounts.
- Monthly/yearly packages, including stopped and older ones.
- Past outreach emails and replies status.

Rules for using it:
- Clients with **unpaid or overdue invoices** get no offer draft. They show in a separate "Skipped – unpaid invoice" list so the team can see why.
- Internal notes help the AI understand the client, but are **never quoted or revealed** in the email.
- The more detail you write into orders, the better the drafts get.

## 2. Monthly scan, including older contracts
- Runs automatically on the first weekday of each month (instead of every weekday), plus a "Scan now" button.
- Covers clients with no order for 3+ months **and** stopped/ended packages (older contracts), so former package clients get a "come back" draft.
- All existing safety rules stay: human approval, 50/day, weekdays 09:00–17:00 Sarajevo, opt-outs, 90-day cooldown, no invented prices or promises.

## 3. "Send test to me" goes only to whoever clicked it
- The test is sent to the email of the logged-in person who pressed the button (e.g. Max Pfenning gets it at his own login email). Nobody else, never the client.
- The button shows the address before sending.
- I found the current send step doesn't handle test mode properly, so this gets fixed too.

## 4. New sidebar page: "Services Knowledge"
- **Our services (manual):** you add, edit or remove what we sell: name, short description, typical price (optional), languages, active yes/no.
- **What clients buy (AI-collected):** monthly the AI groups all orders into services and shows how often each was bought, revenue share, typical clients, and which services are often bought together. You can confirm, rename or hide these.
- When writing drafts, the AI uses only **active** services from this list plus the client's own history. It can suggest a related service, but only from your list and without inventing prices.

## Open points
- Google review checking (earlier plan) stays separate; it can be added on top later.

## Technical details
- `outreach-scan`: extend order select with `description, internal_notes, status, assigned_to`; load `invoices` per client email (exclude if any `status in (sent, overdue)` and unpaid); include `monthly_contracts` with status stopped/ended as eligible "lapsed contract" source. Store skip reason in a new `outreach_skips` table (email, reason, scanned_at). Notes passed to prompt flagged as "context only, never quote".
- Cron: change `outreach-scan-daily` to monthly (first weekday) with bounded batches; keep lock + per-run cap; continue in following daily runs until the month's queue is done.
- `outreach-send` test mode: resolve recipient from the caller's JWT email (`auth.getUser`), ignore any client-provided address, prefix subject `[TEST]`, don't change draft status or daily count.
- New tables `service_catalog` (manual) and `service_insights` (AI aggregates), with grants + RLS for non-client team members. New page `/services-knowledge` + sidebar entry. `_shared/outreachDraft.ts` prompt receives active catalog entries.
- Tests: unpaid-invoice exclusion, lapsed-contract eligibility, test recipient = caller email.
