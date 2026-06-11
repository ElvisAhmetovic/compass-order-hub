## Goal
Make the existing "Auto-Fill Month" button on the Work Hours sheet also **submit & lock each filled day** automatically, and let **super-admins use it on any worker's sheet**.

## Scope (UI / frontend only)

**File:** `src/components/work-hours/WorkHoursTable.tsx`

### 1. Permissions
- Change `canAutoFill` from `isOwnSheet` to `isOwnSheet || isSuper`.
  - Workers: still only on their own sheet (unchanged).
  - Super-admins (the 5 emails already in `WH_SUPER_ADMIN_EMAILS`): can use it on anyone's sheet.

### 2. Button behavior — `handleAutoFill`
For every weekday of the visible month that is **not yet submitted** (`!v2Map[iso]` OR `v2Map[iso].status === 'not_submitted'`) AND is **not in the future**:

1. Compose the default entry: `start_time: '09:00'`, `break_time: '12:00-13:00h'`, `working_hours: 6.5`, `end_time: '17:00'`, `absent: false`.
2. Persist to legacy `work_hours` via `bulkUpsertWorkHours` (keeps break-text display, same as today).
3. Submit & lock each day in `work_hours_v2`:
   - **Super-admin path** (own or other sheet): call `adminUpsert` per day with `status: 'admin_override'`, `locked: true`, `reason: 'Auto-fill month from Work Hours sheet'`, `break_minutes: 60`, `total_hours: 6.5`, start/end normalized to `HH:MM:00`.
   - **Worker path on own sheet**: only the entry for `today` (if it's a weekday and not yet submitted) is submitted via `submitMyHours` — past/future days cannot be self-submitted by workers (current rule). Past unsubmitted weekdays are still filled in legacy but a toast notes "Contact admin to lock past days." Future days are skipped entirely.
4. Run V2 submissions **sequentially** (simple `for…of await`) to avoid hammering the RPC; show progress in the button label ("Filling 3/12…").
5. Refresh local state: merge returned V2 rows into `v2Map` and filled entries into `rows`.

### 3. Skip rules (don't overwrite or re-submit)
- Skip any day already present in `v2Map` with status `admin_override` / `submitted` / `not_worked` (already submitted or marked absent).
- Skip days where `v2Map[iso]?.locked === true`.
- Skip future weekdays.
- Re-fill `not_submitted` (missed) rows: super-admin overrides them; worker path skips them with a toast count.

### 4. Toast feedback
Final toast summarizes: `Filled X days, submitted & locked Y, skipped Z (already submitted / locked / future)`.

### 5. Tooltip / label
Keep icon `Wand2`. Label stays "Auto-Fill Month"; tooltip updated to "Fill weekdays with 09:00 / 12:00–13:00h / 6.5h / 17:00 and submit & lock each day".

## Out of scope
- No DB migration. Uses existing `wh_admin_upsert` and `wh_submit` RPCs.
- No change to defaults (still 09:00 / 12:00–13:00h / 6.5h / 17:00).
- No change to weekend handling (weekends still excluded).
- No change to absence logic or the per-day Submit button.

## Technical notes
- Reuse helpers already in the file: `normalizeTime`, `parseBreakMinutes`, `toIso`, `getWeekdays`.
- `adminUpsert` returns the saved `WorkHourV2`; collect into a temp map and `setV2Map(prev => ({ ...prev, ...newV2 }))` once at the end to avoid render thrash.
- Use a counter in `setFilling` state (e.g. `{ done, total }`) so the button can show progress, then reset.
- Wrap each per-day RPC in try/catch; on a single failure, continue with the next day and include the failure count in the final toast.
