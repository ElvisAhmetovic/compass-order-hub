

## Fix Work Hours: Absent Toggle Errors and Total Hours Calculation

Two issues to fix:

### 1. "Failed to fetch" on absent toggle
The `upsertWorkHour` function uses `.select().single()` which can fail if the upsert doesn't return exactly one row (e.g., due to RLS filtering the response or edge cases with conflict resolution). The fix is to make the upsert more resilient — use `.select()` without `.single()` and take the first result, or simply not require a return value for the toggle operation since we already know the data we're saving.

**File: `src/services/workHoursService.ts`** (line 33-53)
- Change `.select().single()` to `.select()` and return `data?.[0]` — this prevents the "No rows returned" error from `.single()` while still getting the data back.

### 2. Total hours should exclude absent days
Currently line 114 sums `working_hours` for ALL entries including absent ones. Fix: filter out absent entries.

**File: `src/components/work-hours/WorkHoursTable.tsx`** (line 114)
- Change from:
  ```ts
  const totalHours = Object.values(rows).reduce((sum, r) => sum + (r.working_hours || 0), 0);
  ```
- To:
  ```ts
  const totalHours = Object.values(rows).reduce((sum, r) => sum + (r.absent ? 0 : (r.working_hours || 0)), 0);
  ```

### Files to modify
- `src/services/workHoursService.ts` — make upsert more resilient
- `src/components/work-hours/WorkHoursTable.tsx` — exclude absent days from total

