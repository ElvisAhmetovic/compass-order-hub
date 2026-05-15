# Secure Work Hours v2 — Plan

Build a tamper-resistant Work Hours system with a 12:00 noon submission deadline, automatic locking, full audit trail, and a single super-admin override (`luciferbebistar@gmail.com`). All rules enforced in the database and edge functions, not just the UI.

Timezone: `Europe/Sarajevo` (company timezone) used everywhere — server, cron, lock checks, "today" computation.

---

## 1. Database changes (new migration)

### New table `work_hours_v2`
Separate from existing `work_hours` so current data and the existing legacy page are not damaged.

Columns:
- `id`, `user_id`, `worker_email`
- `work_date` (DATE, company tz)
- `start_time`, `end_time`, `break_minutes`, `total_hours`
- `status` enum: `submitted | not_submitted | not_worked | admin_override`
- `locked` bool, `locked_reason`, `locked_at`
- `submitted_at`
- `created_by`, `created_at`, `updated_by`, `updated_at`
- `admin_override_by`, `admin_override_at`
- `admin_note`, `worker_note`
- UNIQUE (`user_id`, `work_date`)

### New table `work_hours_audit_log` (append-only)
- `id`, `work_hours_id`, `worker_id`, `worker_email`
- `action` enum: `created | updated | locked | auto_marked_zero | admin_override | admin_unlock | admin_correction`
- `changed_by_user_id`, `changed_by_email`, `changed_by_role`
- `old_values` jsonb, `new_values` jsonb
- `reason`, `source` (`worker_form | admin_panel | auto_lock_job | api`)
- `created_at`

RLS: SELECT for own rows + super admin; NO insert/update/delete from clients (only SECURITY DEFINER functions write to it).

### Helper SQL
- `is_super_admin()` — `SECURITY DEFINER`, returns true only if `auth.jwt() ->> 'email' = 'luciferbebistar@gmail.com'`.
- `company_today()` — returns `(now() AT TIME ZONE 'Europe/Sarajevo')::date`.
- `company_now()` — returns `now() AT TIME ZONE 'Europe/Sarajevo'`.
- `is_before_deadline()` — true if company time < today 12:00.

### RLS on `work_hours_v2`
- SELECT: `user_id = auth.uid()` OR `is_super_admin()`
- INSERT: blocked from clients (only via RPC).
- UPDATE: blocked from clients (only via RPC).
- DELETE: only `is_super_admin()`.

### SECURITY DEFINER RPCs (only safe write path)
- `submit_work_hours(start_time, end_time, break_minutes, total_hours, worker_note)`
  - Forces `user_id = auth.uid()`, `work_date = company_today()`.
  - Rejects if `company_now() >= today 12:00` and not super admin.
  - Rejects if existing row is `locked` (worker path).
  - Validates ranges (0–24 hours, end > start, break ≤ worked).
  - Writes audit row `created` or `updated` with old/new JSON.
- `admin_upsert_work_hours(target_user_id, work_date, ..., reason)`
  - Requires `is_super_admin()`, else raises.
  - Always permitted (any date, any status, unlock allowed).
  - Sets `admin_override_by/at`, status `admin_override` when overriding lock/past.
  - Audit `admin_override | admin_correction | admin_unlock`.
- `admin_unlock_work_hours(id, reason)` — super admin only.
- Trigger on `work_hours_v2` blocks direct writes from non-`SECURITY DEFINER` paths via `current_setting('app.via_rpc', true)` guard set inside the RPCs.

### Auto-lock cron
- `pg_cron` job every 5 minutes between 12:00–13:00 Sarajevo, calling edge function `auto-lock-work-hours`.
- Edge function:
  - Computes `company_today()`.
  - Skips weekends (configurable; default include all days, can be tuned).
  - For every active worker (profiles role admin/agent) without a row for today, INSERTs a `not_submitted`, `locked=true`, `total_hours=0`, `locked_reason='Missed 12:00 submission deadline'` row.
  - Idempotent (UNIQUE constraint + ON CONFLICT DO NOTHING).
  - Writes `auto_marked_zero` audit rows.
- Plus a fallback: when worker/admin opens the page after 12:00, an edge call ensures lock has run for today.

---

## 2. Edge functions

- `submit-work-hours` — thin wrapper that calls RPC; returns friendly error messages.
- `admin-work-hours` — super-admin-only mutations (upsert, unlock, override, bulk correction).
- `auto-lock-work-hours` — cron-triggered + on-demand; idempotent.
- All use auth context from JWT, validate with Zod, return CORS headers.

---

## 3. Frontend — Worker view (`/work-hours-v2`)

- Today card: date, deadline countdown to 12:00, status badge (Open / Submitted / Locked / Missed).
- Form (only enabled before 12:00 and not locked): start, end, break, total hours, note.
- After submit: shows submitted values + edit button (still until 12:00).
- After 12:00: form disabled, message "Deadline passed. Your work hours for today are locked. Contact admin if this is incorrect."
- Personal history (today onward): list of own entries with status, locked flag, admin override badge.
- Per-row change history drawer: created/updated timestamps, who changed, worker vs admin, admin note.
- Monthly summary: submitted hours, missed days, locked days.

## 4. Frontend — Admin view (`/admin/work-hours`)

- Guarded by `is_super_admin()` check (server-verified via RPC, not just email in client state).
- Daily dashboard: all workers, today's status, who submitted / missed / 0h / overridden.
- Filters: date range, worker, status.
- Edit dialog (any date, any worker): requires reason note when overriding locked or past entries.
- Unlock action with reason.
- Full audit log viewer per entry: old vs new JSON diff, action, source, actor.
- CSV export (client-side from filtered rows).
- Monthly totals per worker.

---

## 5. QA matrix (run after build)

1. Submit before 12:00 — allowed, audit `created`.
2. Edit own before 12:00 — allowed, audit `updated` with old/new.
3. Submit after 12:00 as worker — RPC rejects.
4. Miss deadline — cron creates locked 0h row, audit `auto_marked_zero`.
5. Edit locked day as worker — RPC rejects.
6. Edit other worker as worker — RPC rejects (forces `auth.uid()`).
7. Admin edits after 12:00 — allowed, audit `admin_override` with reason.
8. Admin corrects past day — allowed, audit `admin_correction`.
9. Cron run twice — UNIQUE + ON CONFLICT, no dupes.
10. Audit shows old/new/by/at.
11. Worker INSERT/UPDATE on audit table — RLS rejects.
12. Non-admin opens admin page — guard + server RPC rejects.
13. `luciferbebistar@gmail.com` can override anything.
14. Browser tz changed — server uses Sarajevo, no bypass.

---

## Technical notes

- Existing `work_hours` table is left untouched; new table `work_hours_v2` avoids breaking current Work Hours page. Optionally we can later swap the routes.
- Super-admin identity is derived from `auth.jwt() ->> 'email'` server-side; client-side email checks are decorative only.
- All write paths go through SECURITY DEFINER RPCs; direct table writes from anon/authenticated roles are revoked.
- Validation duplicated in RPC (authoritative) and UI (UX only).
- Idempotency via UNIQUE(`user_id`,`work_date`) + ON CONFLICT.

---

## Open confirmations

1. Should weekends (Sat/Sun) be auto-locked too, or skipped? (Default in plan: auto-lock every day.)
2. Should this replace the existing `/work-hours` page, or live in parallel at `/work-hours-v2` until validated? (Default: parallel, then swap.)
3. Confirm `Europe/Sarajevo` is the company timezone (existing code uses `Europe/Berlin` in `check-daily-attendance`). Pick one.
