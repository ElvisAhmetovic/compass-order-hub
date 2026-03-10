

## Attendance Tracking for Work Hours

### What
Two features:
1. **Manual toggle** — A small icon/button next to each day row that admins can click to mark someone as absent (turns red). Clicking again removes the absent flag.
2. **Automatic absence detection** — A cron edge function that runs daily at 10:00 AM Duisburg time (Europe/Berlin). For each user with role admin/agent, it checks if they have any activity today (in `team_activities`, `order_audit_logs`, or `messages`). If zero activity is found, it auto-sets that day's `absent` flag to `true` in the `work_hours` table.

### Database Changes

**Add `absent` column to `work_hours`:**
```sql
ALTER TABLE work_hours ADD COLUMN absent boolean NOT NULL DEFAULT false;
```

### Frontend Changes

**`src/services/workHoursService.ts`**
- Add `absent` to the `WorkHourEntry` interface
- Include `absent` in all upsert operations

**`src/components/work-hours/WorkHoursTable.tsx`**
- Add an "Attendance" column with a clickable icon (e.g., `UserCheck` / `UserX` from lucide)
- Default state: green `UserCheck` icon (present)
- When `absent === true`: red `UserX` icon, row gets a red tint (`bg-red-50`)
- Clicking the icon toggles `absent` and saves via upsert
- The absent styling takes priority over vacation styling

### Edge Function: `check-daily-attendance`

**`supabase/functions/check-daily-attendance/index.ts`**
- Runs via cron at `0 10 * * 1-5` (10:00 UTC+1/+2 — we'll use `0 8 * * 1-5` UTC to approximate 10 AM CET)
- Gets today's date in Europe/Berlin timezone
- Queries all users from `profiles` where role in ('admin', 'agent')
- For each user, checks if ANY row exists in `team_activities` OR `order_audit_logs` OR `messages` with `created_at` today
- If no activity found, upserts `work_hours` with `absent = true` for that user/date
- Does NOT overwrite if the row already exists and has data (start_time filled = they logged hours manually)

**`supabase/config.toml`**
- Add `[functions.check-daily-attendance]` with `verify_jwt = false`

### Cron Setup
A pg_cron job calling the edge function at `0 8 * * 1-5` (8:00 UTC ≈ 10:00 CET, weekdays only). Will be set up via SQL insert.

