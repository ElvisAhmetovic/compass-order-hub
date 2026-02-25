

## Auto-Fill Work Hours Month

### What
Add a button to the Work Hours page that pre-fills all weekdays in the selected month with default values: Start 09:00, Break 12:00-13:00h, Hours 6.5, End 17:00. Only fills days that don't already have data.

### Changes

| File | Change |
|------|--------|
| `src/components/work-hours/WorkHoursTable.tsx` | Add an "Auto-Fill Month" button above the table. On click, iterate all weekdays for the month, skip any that already have data, and upsert default values for the rest. Update local state to reflect the new entries. |
| `src/services/workHoursService.ts` | Add a `bulkUpsertWorkHours(entries: WorkHourEntry[])` function that upserts multiple rows at once using `.upsert(entries, { onConflict: 'user_id,date' })` |

### Default Values
- `start_time`: `"09:00"`
- `break_time`: `"12:00-13:00h"`
- `working_hours`: `6.5`
- `end_time`: `"17:00"`
- `note`: `null`

### Behavior
- Button labeled "Auto-Fill Month" with a wand/zap icon
- Only fills days that have NO existing entry (won't overwrite manually entered data)
- Shows a confirmation toast after filling
- Updates the table immediately without requiring a page reload

