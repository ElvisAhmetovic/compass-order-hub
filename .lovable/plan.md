# QA Findings + Prioritized Fix Plan

Based on a broad sweep of the DB linter, slow-query stats, and the recent invoice/order/work-hours work.

---

## P0 — Fix now (correctness, security, cost)

### 1. Orders list query has no supporting index (huge perf/cost hit)

The single query that lists dashboard orders (`is_yearly_package <> …, deleted_at IS NULL, status_deleted <> …, ORDER BY created_at DESC LIMIT/OFFSET`) has run **~101,000 times** and burned **~2,650 seconds** of DB time. It's the top slow query by a wide margin.

- **Fix:** add a partial index on `orders(created_at DESC) WHERE deleted_at IS NULL AND status_deleted <> 'deleted' AND is_yearly_package = false`.
- Also add `profiles(role)` index (2nd-worst query, 271s total).

### 2. Security linter: 2 ERROR-level findings

- **Exposed auth.users** via a view/materialized view reachable by anon/authenticated.
- **SECURITY DEFINER view** running with creator's privileges instead of the caller's.
- **Fix:** identify the offending views (likely `client_orders` / `team_members_view` / a profile projection), drop `SECURITY DEFINER`, and remove any `auth.users` exposure — replace with a filtered view or an RPC.

### 3. Public-executable SECURITY DEFINER functions

Several `SECURITY DEFINER` functions are `EXECUTE`-able by `anon`. Combined with `verify_jwt=false` edge functions, this is a privilege-escalation surface.

- **Fix:** `REVOKE EXECUTE … FROM anon` on every SECURITY DEFINER function that isn't intentionally public (keep only `has_role`, `is_admin`, `is_client`, review-request helpers, etc.).

### 4. RLS "always true" policies on write operations

Linter flags UPDATE/DELETE/INSERT policies with `USING (true)` / `WITH CHECK (true)`. Any authenticated user can mutate those rows.

- **Fix:** review the flagged tables and scope policies (likely `notifications`, `client_email_logs`, or similar) to `auth.uid()` / `is_admin()`.

---

## P1 — High-value correctness fixes

### 5. Invoice edits: line items still risk drifting from header totals

`updateLineItem` saves items separately from `handleSave`. If the header save fails after line items save (or vice versa), totals and Bill-To can diverge.

- **Fix:** wrap header + line items in a single RPC (`update_invoice_with_lines`) so it's atomic, and rely on the existing `recalculate_invoice_totals` trigger.

### 6. Auto-invoice on order status: no guard against multiple in-flight requests

Double-clicking "Invoice Paid" or two admins toggling near-simultaneously can each pass the "no active invoice" check before the unique index fires — the second one just errors in the UI without feedback.

- **Fix:** in `OrderService.toggleOrderStatus`, catch `23505` on invoice insert and surface "Invoice already exists" toast instead of generic failure.

### 7. Review-request trigger swallows all errors silently

The `orders_review_request_trigger` wraps `net.http_post` in `EXCEPTION WHEN OTHERS`. Good for not blocking order updates, but there's no log row → if Resend/edge function is down we never know.

- **Fix:** on exception, insert into a small `review_request_errors` table (or `client_email_logs` with type='review_request_error').

### 8. Client matching still fuzzy in one spot

`OrderRow.tsx` and `orderService.ts` were tightened, but `SendInvoicePDFDialog` uses `client?.email` directly for the "to" field — if the invoice's Bill-To override differs from the linked client email, the PDF cover email still goes to the old client.

- **Fix:** prefer `invoice.bill_to_email` over `client.email` when populating recipient.

### 9. Work-hours "Fill" per-row button — no undo, no confirmation

Workers can mis-tap and instantly submit+lock a wrong day. There's no admin-side alert either.

- **Fix:** add a confirm dialog (or 3-second toast with "Undo") before locking.

---

## P2 — UX polish & consistency

10. **Invoices list**: sort by `bill_to_name` fallback is done, but search doesn't index `invoice_number` prefix — typing "1068" is slow on large tables. Add DB index on `invoices(invoice_number)`.
11. **Offers manual link**: WhatsApp/Viber quick-share added, but link is copied without a `utm_source=offer_share` param → analytics can't attribute conversions.
12. **Social reports**: Edit/Delete buttons landed, but no confirmation on Delete — one click destroys a week's data.
13. **PDF branding**: "AB MEDIA TEAM LTD" updated in invoice/proposal PDFs. Verify it's also updated in monthly-installment emails, offer emails, and support email footers (I only touched 3 files).
14. **Notification queue**: 8s protective delay is fine for single actions, but bulk actions (e.g. sending reminders to 12 members) still risk Resend 429 if two admins act simultaneously. Add a distributed lock via a `notification_locks` table.

---

## Prioritized execution order

If you approve, I'd tackle in this order over one or two turns:

1. **Turn A (P0 infra):** add the two indexes, fix the ERROR-level linter items, revoke anon EXECUTE on non-public SECURITY DEFINER functions, scope the always-true RLS policies.
2. **Turn B (P1 correctness):** atomic invoice update RPC, 23505 handling on invoice create, review-request error logging, Bill-To email in `SendInvoicePDFDialog`, work-hours confirm/undo.
3. **Turn C (P2 polish):** invoice_number index, offer UTM, social-report delete confirm, brand-string sweep, notification lock.

---

## Technical notes

- **Index SQL (Turn A):**
  ```sql
  CREATE INDEX idx_orders_dashboard_list
    ON public.orders (created_at DESC)
    WHERE deleted_at IS NULL AND status_deleted <> 'deleted' AND is_yearly_package = false;
  CREATE INDEX idx_profiles_role ON public.profiles (role);
  CREATE INDEX idx_invoices_invoice_number ON public.invoices (invoice_number);
  ```
- **Linter items to resolve** live at the pg_catalog level; I'll pull the exact object names in Turn A before writing the migration.
- **Atomic invoice RPC:** `update_invoice_with_lines(p_invoice_id uuid, p_header jsonb, p_lines jsonb)` — runs inside a single transaction, calls `recalculate_invoice_totals` at end.

---

## What I need from you

- Approve the plan (or narrow to one turn / one area).
- Confirm the "Fill" work-hours button should get a confirm dialog vs. undo toast — I'll default to **Undo toast** (faster for workers) unless you prefer confirm.

whatever you do, make sure that current finctonality does not break, this is important, this is a live site that is being used by our company, if it breaks, its on you.