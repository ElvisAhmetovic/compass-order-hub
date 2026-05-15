# Work Hours Admin — full upgrade (all 10 improvements)

## Goal
Turn `/admin/work-hours` into a real payroll-ready dashboard: monthly grouping, totals, missing-day visibility, bulk actions, inline audit, color-coded statuses, realtime, smarter exports, and a sidebar badge for late submissions.

## Scope
Frontend-heavy. One small DB migration to add an admin RPC for bulk lock/unlock with audit logging. No schema changes to `work_hours_v2`.

---

## 1. Monthly grouping view
- New "View" toggle in toolbar: **List | Monthly**.
- Monthly view groups rows by `worker → month (YYYY-MM)` with a collapsible header showing: worker name, month label (e.g. "May 2026"), submitted hours total, expected workdays, missing-day count.
- Existing flat list stays as default ("List" mode).

## 2. Quick date presets
- Toolbar buttons: **Today | This week | This month | Last month | Last 14 days | Custom**.
- Selecting a preset sets `from`/`to` and reloads. Custom keeps the existing date inputs visible.

## 3. Per-worker totals + grand total cards
- Above the table: 4 KPI cards — **Total hours**, **Workers active**, **Entries**, **Avg hrs/day per worker**.
- Computed from current `filtered` set, recomputed on filter change.

## 4. Missing-day visibility
- Compute the set of weekdays (Mon–Fri) in `[from, to]` per worker. Subtract submitted dates.
- Render missing days as light-grey rows with status chip "Missing" + a "+ Create entry" inline shortcut (super-admin only).
- Toggle in toolbar: **Show missing days** (off by default to keep current behavior).

## 5. Bulk lock / unlock
- Add a checkbox column. Header checkbox = select all currently visible.
- Toolbar shows **Lock selected** / **Unlock selected** buttons when 1+ rows are selected, with a single reason prompt that applies to the whole batch.
- Calls a new RPC `wh_admin_bulk_set_lock(ids uuid[], lock boolean, reason text)` which loops, writes audit rows, returns counts. Super-admin only.

## 6. Inline audit indicator
- Each row gets a small subscript "edited Nx" link when audit count > 1, derived from a lightweight count query (`select work_hours_id, count(*) from work_hours_audit_log where work_hours_id in (...) group by 1`).
- Clicking it opens the existing audit dialog (no new UI needed).

## 7. Status color coding
- Replace plain status text with `Badge` chips:
  - Submitted → green
  - Admin override → amber
  - Not submitted → red
  - Not worked → slate
- Locked icon shown next to chip in red when locked.

## 8. Realtime refresh
- Subscribe to Postgres changes on `work_hours_v2` (filter by date range when supported, otherwise client-filter).
- On insert/update, patch local `rows` state in place (no full reload thrash).
- Cleanup on unmount.

## 9. Smarter exports
- Above the export buttons, line: **"X entries · Y total hours · Z missing days"** matching current filter.
- The existing CSV/Excel exports already honor filters; add a third button **"Excel by worker"** that produces one workbook with one sheet per worker (using current monthly grouping). Same formatting as the main Excel export.

## 10. Sidebar badge
- In `Sidebar.tsx`, the "Work Hours Admin" item gets a small red badge with the count of `(active workers today − submitted today entries)` when > 0, refreshed every 5 min.
- Tooltip: "N late submissions today".
- Only visible to super-admins (item is already gated).

---

## Database changes
Migration adds **only**:
- `wh_admin_bulk_set_lock(ids uuid[], p_lock boolean, p_reason text)` — security definer, super-admin guard, writes one `admin_lock` / `admin_unlock` audit row per entry. Returns updated count.

No table changes, no policy changes.

## Files
- `src/pages/WorkHoursAdmin.tsx` — most of items 1–7, 9
- `src/services/workHoursV2Service.ts` — add `bulkSetLock`, `fetchAuditCounts`, `subscribeAllEntries`, `fetchLateCountToday`
- `src/components/dashboard/Sidebar.tsx` — item 10 badge
- `supabase/migrations/<new>.sql` — RPC for bulk lock

## QA
1. Switch to Monthly view → see workers grouped by month with subtotals matching List view sums.
2. Click "Last month" preset → range updates, KPI cards refresh.
3. Toggle "Show missing days" → grey rows appear for unsubmitted weekdays; super-admin can create directly.
4. Select 3 rows, click "Lock selected", enter one reason → all 3 lock, audit log shows 3 entries.
5. Edit one entry from another tab → admin page updates within ~2 seconds without manual refresh.
6. "Excel by worker" downloads .xlsx with one tab per worker, all formatted.
7. Sidebar badge appears for super-admins when >0 workers haven't submitted today; clears once everyone submits.
