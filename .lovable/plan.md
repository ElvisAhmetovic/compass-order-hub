
## Goal

Give super admins a single place to see **every invoice creation attempt** — successes and failures — so when a worker says "I clicked the button and nothing happened," you can immediately see who tried, for which order, what invoice number was assigned (or what error blocked it, e.g. 409 duplicate), and when.

## What gets recorded

For every invoice creation attempt (manual, from-order, and the auto-create inside `toggleOrderStatus`):

- Actor: user id, email, full name, role
- Order context: order id, company name, contact email, order date, price
- Client context: resolved client id + name (so we can spot duplicate-client mismatches like the Nousgerons case)
- Outcome: `success`, `conflict_409`, `validation_error`, `permission_denied`, `unknown_error`
- Invoice number (when generated) + invoice id (on success)
- Attempt number (for retry loop in `InvoiceService.createInvoice`)
- Error code (e.g. Postgres `23505`), error message, raw payload snippet
- Source: `manual_invoice_page`, `order_actions_button`, `order_status_toggle`, `bulk_sync`
- Timestamp + user-agent

## Database

New table `public.invoice_audit_logs` (admin-read-only, append-only):

```text
id, created_at,
actor_user_id, actor_email, actor_name, actor_role,
order_id, order_company_name, order_contact_email, order_price, order_currency,
client_id, client_name,
invoice_id (nullable), invoice_number (nullable),
outcome (text), error_code (text), error_message (text),
attempt_number (int, default 1),
source (text),
metadata (jsonb)
```

- RLS: only super admins (`wh_is_super_admin()` already exists) can `SELECT`; `authenticated` can `INSERT` their own rows (`actor_user_id = auth.uid()`); `service_role` full access.
- Index on `created_at desc`, `order_id`, `actor_user_id`, `outcome`.
- No FK on `order_id` / `invoice_id` (so a failed attempt with a bad id still logs).

## Backend logging hooks

Add a small helper `logInvoiceAttempt(payload)` in `src/services/invoiceAuditService.ts` that inserts into the new table and never throws (failure to log must never block invoice creation).

Wire it into the three creation paths:

1. `src/services/invoiceService.ts` → `createInvoice`: log on success, log on each retry, log on final failure with the Postgres error code (catches the 409 / `23505` duplicates).
2. `src/components/dashboard/OrderActions.tsx` → `createInvoiceFromOrder`: log when the order→client resolution picks a client and when the create call returns / throws.
3. `src/services/orderService.ts` → `toggleOrderStatus` auto-create branch: log the auto-create attempt + outcome, including which fallback matched (name+email / email-only / name-only / new client).

Each call passes `source` so the log row tells you which entry point triggered it.

## Admin UI

New route `/admin/invoice-audit` (super-admin only, guarded the same way the work-hours admin pages are) with page `src/pages/admin/InvoiceAuditLogPage.tsx`:

- Table with columns: Time · Actor · Order (company + date) · Client · Invoice # · Outcome (colored badge) · Error · Source
- Filters: outcome (success / conflict / error), actor, date range, free-text search (matches invoice #, company, email, error message)
- Row click → side panel with the full `metadata` JSON, attempt history for that order, and a "View invoice" / "View order" deep link
- Pagination (100/page) + CSV export of the current filter
- Add a link to it from the existing admin sidebar under the Invoices section, visible only to super admins

## Files touched

- New migration: create table + RLS + indexes
- New: `src/services/invoiceAuditService.ts`
- New: `src/pages/admin/InvoiceAuditLogPage.tsx` + small `InvoiceAuditTable.tsx`, `InvoiceAuditFilters.tsx` components
- Edit: `src/services/invoiceService.ts`, `src/services/orderService.ts`, `src/components/dashboard/OrderActions.tsx` — add `logInvoiceAttempt` calls (no behavior changes)
- Edit: `src/App.tsx` (route) + sidebar config to expose the link

## Out of scope (ask if you want these too)

- Backfilling history for past invoices (we can't reconstruct failed attempts that were never recorded; successes could be backfilled from `invoices.created_at` + `created_by` if that column exists — let me know).
- Email/Slack alert when a `conflict_409` occurs.
- Logging invoice **edits** and **deletes** (this plan covers creation only, matching your request).
