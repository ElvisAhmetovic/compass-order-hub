# Work hours: remove auto-fill, require a daily work note

## Goal
Every person must write what they did that day before the day can be locked in. The note field also carries the reason when someone is absent. Auto-filling a whole month is removed so days can't be closed without real input.

## What changes on the Work Hours sheet

1. **Remove the "Auto-Fill Month" button** at the top of the sheet.
2. **Remove the per-day "Fill" button** next to each date. It filled default times and locked the day instantly, which would bypass the new note requirement.
3. **Rename the last column** from "Note" to "What did you do today?" with a helpful placeholder:
   - normal day: "e.g. Edited 3 client videos, answered support tickets"
   - absent day: "Reason for absence (e.g. VACATION, SICK)"
4. **Note becomes required before submitting a day.** Pressing the submit/lock check on a day with an empty note shows a clear message ("Write what you did today before locking the day") and does not submit.
   - Applies to worked days (must describe the work) and absent days (must give the reason).
   - Minimum of 3 characters so a single space or dot doesn't pass.
5. **Visual hint**: while a day is unlocked and has no note, the note box gets a subtle warning border, and the submit check is dimmed with a tooltip explaining what's missing.
6. **The worker's note is saved with the submission** so it reaches the Work Hours Admin view (currently the note is already sent through for workers; the same note is also stored for admin-side saves so it isn't lost).

## Applies to
All sheets: workers, agents and admins editing their own month, and super-admins editing someone else's day.

## Technical notes
- Single file: `src/components/work-hours/WorkHoursTable.tsx`.
- Delete `handleAutoFill`, `handleAutoFillDay`, `filling`, `fillProgress`, `canAutoFill`, the `Wand2` import and the now-unused `bulkUpsertWorkHours` import.
- In `handleSubmitDay`, add a note check before the existing hours check; for absent days skip the hours check but still require the note.
- Super-admin path (`adminUpsert`) passes the note into `admin_note`, worker path already passes `worker_note`.
- Run TypeScript check and the existing test suite afterwards.
