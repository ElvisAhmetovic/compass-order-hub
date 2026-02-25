

## Fix Work Hours: RLS Error + English Labels + Full Day Names

### Problem 1: RLS Error
The INSERT policy only allows `auth.uid() = user_id`. When an admin saves hours for another user via the dropdown, the `user_id` differs from `auth.uid()`, causing the RLS violation. The UPDATE policy already allows admins, but INSERT does not.

### Problem 2: Language/Labels
Current headers use mixed German/Bosnian ("Tag", "Notiz", abbreviated day names "Mo", "Di"). User wants everything in English with full day names.

### Changes

**New migration** to fix RLS INSERT policy:
```sql
DROP POLICY "Users can insert own work hours" ON public.work_hours;
CREATE POLICY "Users can insert own work hours"
ON public.work_hours FOR INSERT
WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
```

**`src/components/work-hours/WorkHoursTable.tsx`**:
- Change `DAY_NAMES` from `['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']` to `['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']`
- Remove the "Tag" (day abbreviation) column header and cell
- Rename headers: "Nr." → "#", "Datum" → "Date", "Početak" → "Start", "1 Pauza" → "Break", "Radno Vrijeme" → "Hours", "Kraj" → "End", "Notiz" → "Note"
- Update placeholder text to English (e.g. "z.B. GODISNJI" → "e.g. VACATION")
- Update footer text: "Gesamt Stunden" → "Total Hours"
- Merge the day name into the Date column (e.g. "Monday, 02.02.2026")

