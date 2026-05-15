# Lock-down editing on submitted days

## Goal
Once a worker clicks "Submit & Lock" on a day in `/work-hours`, every field on that row (start, break, hours, end, notes, absent toggle, etc.) becomes read-only for everyone except the 5 super-admins (Elvis, Thomas Klein x3, Johann Nowak). Super-admins keep full edit access via the existing Unlock flow.

## Scope
Frontend only. No DB changes — the lock state already lives in `work_hours_v2.locked` and `wh_submit` enforces server-side rejection. This change just mirrors that lock visually/interactively in the legacy `/work-hours` table so users can't even type into the inputs.

## Changes

### `src/components/work-hours/WorkHoursTable.tsx`
- For each row, derive `isLocked` from the matching `work_hours_v2` entry already fetched (locked=true).
- Derive `canEdit = !isLocked || isSuperAdmin`.
- Apply `disabled` / `readOnly` to all editable cells on that row when `!canEdit`:
  - start time, end time, break, total hours inputs
  - notes / worker_note input
  - absent toggle button
  - any inline dropdowns
- Add a subtle muted style + lock tooltip ("Locked — contact admin to unlock") on disabled cells.
- Submit button stays as it already is (green check + lock icon when locked; super-admin sees Unlock).

### No other files
Service layer and RPCs already enforce this server-side; no changes needed there.

## QA
1. As `luciferbebistar@gmail.com` (super-admin): submit today → row locks → confirm fields stay editable for me, Unlock button visible.
2. As a regular admin/agent (non-super): submit today → row locks → confirm every input is disabled, absent toggle disabled, no Unlock button.
3. Refresh page → locked state persists from DB.
4. Super-admin unlocks → fields become editable again for the worker.
