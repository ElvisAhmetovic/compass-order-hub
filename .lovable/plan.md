## Goal

Show the per-day Auto-Fill (wand) button next to the date on every weekday row where it can actually do something, so workers and super-admins can clearly see and use it. Today it's hidden in almost all cases.

## Why it's hidden now

In `src/components/work-hours/WorkHoursTable.tsx` the button only renders when:

```
!isLocked && !isMissed && !isFuture && (isSuper || (isOwnSheet && iso === today))
```

Result:
- All rows in your screenshot are already locked → button hidden everywhere.
- For regular workers, even on an empty sheet only the row for *today* would show it.

## Change

Update the visibility rule for the per-day wand button (date cell only):

- **Super-admins**: show on every weekday row that isn't locked, isn't missed, and isn't in the future — on any user's sheet.
- **Workers on their own sheet**: show on every weekday row that isn't locked, isn't missed, and isn't in the future (today AND past). Past days will fill the legacy `work_hours` row and show the existing "Filled but not locked — contact admin to lock past days" toast (already handled in `handleAutoFillDay`).
- **Locked rows**: still hide the button (use the existing Unlock affordance for super-admins).
- **Missed rows**: still hide (super-admin can use the row's other controls / Auto-Fill Month).
- **Future rows**: still hide.

Also make the button more visible:
- Bump icon size from `h-3.5 w-3.5` to `h-4 w-4`.
- Add a subtle border/background so it reads as a button, e.g. `border border-primary/30 bg-primary/5`.
- Keep the existing tooltip text.

## Out of scope

- No change to `handleAutoFillDay` logic, defaults, permissions on the RPC side, or the month-level button.
- No DB changes.
- No change to locked/missed/future row rendering or the Submit/Absent columns.

## Files

- `src/components/work-hours/WorkHoursTable.tsx` — adjust the condition around lines 556–566 and the button's classes.
