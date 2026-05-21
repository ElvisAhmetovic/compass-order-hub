# Fix Work Hours Page Saving the Wrong Data Source

## Problem

The super-admin email fix is already in place, but the screen the user is actually using is still the old `/work-hours` page.

That page:

- reads and writes `public.work_hours`
- shows lock/submission state from `public.work_hours_v2`
- does not use the admin RPCs that persist overrides in the V2 system

Result: a super admin can change checkmarks, hours, and notes on `/work-hours`, but after refresh the visible state is rebuilt from the newer V2 records and the old-table edits appear to “revert”.

## Fix

Make `/work-hours` use the same V2 persistence rules as the real admin system so edits for past days, today, locked days, and “worked” status all save to the authoritative source and survive refresh.

## Changes

### 1. Unify the `/work-hours` page with V2 saving

Update the `WorkHoursTable` flow so super-admin edits for any selected employee save through `wh_admin_upsert` / `work_hours_v2` instead of the legacy `work_hours` table.

This includes:

- changing hour, start, end, break, and note values
- toggling absent / worked state
- editing past or future dates as super admin
- editing rows that are currently locked

### 2. Keep old and new UI behavior aligned

Preserve the existing table UI on `/work-hours`, but connect its actions to the same business rules already used on `WorkHoursAdmin`:

- super admins can override any date
- non-super users keep the existing restrictions
- lock state shown in the table matches the data source being saved
- refresh reloads the exact saved values

### 3. Remove the stale dual-source mismatch

Replace the mixed old/new loading strategy so the page no longer combines editable fields from `work_hours` with status data from `work_hours_v2`.

Technical direction:

- either read/write only V2 for this screen
- or map legacy rows into V2-compatible display state while saving only to V2

The goal is one authoritative save path.

## Technical details

- `src/components/work-hours/WorkHoursTable.tsx` is the main bug location.
- `src/services/workHoursService.ts` is legacy and currently powers `/work-hours`.
- `src/services/workHoursV2Service.ts` already has the correct admin RPCs and lock logic.
- No new database schema change is planned unless a missing policy or RPC edge case appears during implementation.

## Verification

After implementation, verify on `/work-hours` as a super admin:

1. Open another employee sheet (for example Suzie).
2. Change old days like 7, 8, 9, 10 to worked.
3. Change hours/start/end/note on those days.
4. Refresh the page.
5. Confirm all values remain changed.
6. Confirm locked days can still be overridden by super admin and remain overridden after refresh.
