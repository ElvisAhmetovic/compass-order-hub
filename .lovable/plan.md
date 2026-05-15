# Bridge legacy Work Hours → Admin Work Hours (v2)

The `/admin/work-hours` page and `work_hours_v2` table + audit log already exist. They currently aren't fed by the legacy `/work-hours` page (which writes to a different table, `work_hours`). The user's described workflow needs the legacy "green check" button to also submit + lock the day into v2, so it shows up in the admin page with timestamp and audit trail.

## Behavior change on `/work-hours` (legacy table)

Repurpose the green check / red X button at the left of each row into a Submit-and-Lock action that writes to `work_hours_v2` via the existing `wh_submit` RPC, in addition to its current absent toggle. Visual states per row:

- Empty row → outline check, click does nothing useful (toast: "Fill start/end/hours first").
- Filled but not yet locked → green check button: "Submit & lock day". Clicking calls `wh_submit` with the row's start, end, break (parsed from `12:00-13:00h`), and hours; status becomes `submitted` + `locked = true`.
- Locked → green check + small lock icon. Worker cannot click. Super admin sees an Unlock button (calls `wh_admin_unlock` with a reason prompt).
- The existing absent toggle moves into a separate small icon next to it so the two actions don't collide.

Server rules already enforce: only today, before 12:00 Sarajevo, super admins bypass. Any rejection is shown as a toast.

After a successful submit, the legacy row stays as-is (so the existing month view doesn't break), but `/admin/work-hours` immediately shows the entry like:
"Elvis Ahmetovic — 15.05.2026 — submitted at 09:30 — 6.5h — locked".

## Lock flag in the wh_submit RPC

`wh_submit` currently sets `status = 'submitted'` but leaves `locked = false`. Update it so that, on a normal (non-admin) submit, it also sets `locked = true` + `locked_reason = 'Submitted by worker'` + `locked_at = now()`. Super-admin re-submits keep the existing `admin_override` branch.

## Frontend changes

- `src/components/work-hours/WorkHoursTable.tsx` — split the left action button into Submit/Lock + Absent; wire Submit to a new helper.
- `src/services/workHoursV2Service.ts` — add `submitDay({ workDate, startTime, endTime, breakMinutes, totalHours, workerNote })` wrapper around `wh_submit` (pure passthrough but keeps the legacy file decoupled).
- Show locked state by reading the matching `work_hours_v2` row for the visible month/user (one extra query alongside the existing `fetchWorkHours`). Lock badge per row.

## QA test (executed by me before handing back)

For `luciferbebistar@gmail.com`:

1. Read current `work_hours_v2` row for today; if present, unlock+delete via SQL to start clean.
2. Submit via `wh_submit` RPC (simulated as super admin) → expect row inserted, locked=true, audit `created`.
3. Call `wh_admin_unlock` with reason "QA: re-test" → expect locked=false, audit `admin_unlock`.
4. Re-submit `wh_submit` → expect locked=true again, audit `updated` (and `admin_override` since previously admin-touched).
5. Verify `/admin/work-hours` shows the entry and the 3 audit rows (`created`, `admin_unlock`, `admin_override`).
6. Cleanup the QA row after verification (delete via SQL as super admin).

I'll also visually confirm the legacy page green-button now triggers the lock and the admin page picks it up.

## Files touched

- DB migration: update `wh_submit` to set `locked=true` on worker submit.
- `src/services/workHoursV2Service.ts`
- `src/components/work-hours/WorkHoursTable.tsx`
