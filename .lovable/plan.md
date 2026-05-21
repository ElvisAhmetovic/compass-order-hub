# Stop work hours from auto-appearing as "present + locked"

## Problem

New days look "checked as present and locked" for everyone even when no one submitted. Three things conspire to cause this:

1. The 10:00 cron (`check-daily-attendance`) writes legacy `work_hours` rows. Any legacy row that isn't `absent: true` renders as a green "worked" row.
2. The 12:00 cron (`wh_auto_lock_today`) inserts a `work_hours_v2` row for every admin/agent with `locked: true`, regardless of whether they submitted.
3. The "Auto-Fill Month" button bulk-creates default 09:00–17:00 rows in the legacy `work_hours` table — those then look like a real workday.

## Fix (display + automation only — no schema change)

### A. Treat empty days as empty
- In `WorkHoursTable.tsx`, change the rendering so a day with no `v2` row AND no legacy row stays visually empty: no green submit check, no "present" styling, no implied hours.
- A day should only render as "worked / submitted / locked" when an explicit `work_hours_v2` row exists with `status IN ('submitted','admin_override')` OR a legacy row exists with real `start_time`/`working_hours` filled by a human.
- A row created by the missed-deadline auto-lock (`status='not_submitted'`, `locked=true`) keeps the existing red "Missed" badge but must NOT render as a green/locked workday and must NOT contribute to the totalHours sum.

### B. Stop the legacy auto-default-fill from looking automatic
- Remove the auto-default behavior on initial page load (no implicit fallback row in `buildEntry` / `getEntry` when nothing exists). The user must click "Auto-Fill Month" intentionally to seed defaults.
- Keep the "Auto-Fill Month" button (it's an explicit user action), but only enable it for the row owner or a super admin viewing their own sheet — don't auto-fill another person's sheet.

### C. Keep the 12:00 auto-lock but make it non-misleading
- Leave `wh_auto_lock_today` as-is server-side (it correctly marks missed days as `not_submitted` + locked for accountability).
- In the UI, missed/auto-locked rows render with the existing "Missed" badge only — no green check, no hours, no fake start/end times.

### D. Disable the 10:00 legacy attendance cron's silent inserts
- Update `supabase/functions/check-daily-attendance/index.ts` so that when no activity is found it does NOT upsert a `work_hours` row at all. Absence will be inferred at read time from the absence of a submission, matching the V2 model. (Existing rows are untouched.)

## Files touched

- `src/components/work-hours/WorkHoursTable.tsx` — display logic, totals, autofill gating
- `supabase/functions/check-daily-attendance/index.ts` — remove the silent absent-upsert

## Verification

1. Load `/work-hours` for a worker who hasn't submitted today → row appears empty (no green check, no locked icon, no hours).
2. After 12:00 with no submission → row shows red "Missed" badge only; hours total excludes it.
3. Worker submits today's hours → row turns green/locked as expected.
4. Super admin edits a past day → change persists after refresh (already fixed previously).
5. Clicking "Auto-Fill Month" still works on the user's own sheet.
