

## Work Hours Tracking (Radni Sati) Feature

### What
A timesheet/work hours tracking system similar to the Google Sheet shown in the image. Each admin/agent gets their own monthly timesheet with columns: Datum, Početak (start), 1 Pauza (break), Radno Vrijeme (working hours), Kraj (end). Weekends (Saturday/Sunday) are automatically excluded from the list of days.

### Database

A new Supabase table `work_hours` to store entries:

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, auto |
| user_id | uuid | FK to auth.users |
| date | date | The work day |
| start_time | text | e.g. "09:00" |
| break_time | text | e.g. "12:00-13:00h" |
| working_hours | numeric | e.g. 6.5 |
| end_time | text | e.g. "17:00h" |
| note | text | e.g. "GODISNJI" for vacation |
| created_at | timestamptz | auto |
| updated_at | timestamptz | auto |

RLS: Users can manage their own entries. Admins can view all entries.

### New Files

| File | Purpose |
|------|---------|
| `src/pages/WorkHours.tsx` | Main page with Layout, month/year selector, user selector (admins can view other users), and the editable timesheet table |
| `src/components/work-hours/WorkHoursTable.tsx` | The table component that generates all weekdays for the selected month, renders editable cells for each column, auto-calculates working hours from start/end/break |
| `src/components/work-hours/MonthYearSelector.tsx` | Month and year picker to navigate between months |
| `src/services/workHoursService.ts` | CRUD operations for the `work_hours` table |

### Modified Files

| File | Change |
|------|--------|
| `src/components/dashboard/Sidebar.tsx` | Add "Work Hours" menu item with a Clock icon, visible to admin and agent roles |
| `src/App.tsx` | Add `/work-hours` route |

### How It Works

1. **Month generation**: For the selected month/year, generate all dates, filter out Saturdays and Sundays (using `getDay()`)
2. **Table display**: Each weekday row shows the date in DD.MM.YYYY format, with editable inputs for start time, break, working hours, and end time
3. **User selector**: Admins see a dropdown to pick any team member's timesheet. Non-admins only see their own.
4. **Saving**: Each row auto-saves on blur (upsert by user_id + date)
5. **Vacation/special**: Users can type "GODISNJI" or similar text in the note field, which highlights the row in green (like the screenshot)
6. **Summary row**: Shows total working hours for the month at the bottom

### Technical Details

- Weekday filtering: `const isWeekend = (date: Date) => date.getDay() === 0 || date.getDay() === 6`
- Generate all days of month: loop from day 1 to last day, keep only weekdays
- The table uses inline editing with controlled inputs
- Data is fetched per user per month from Supabase
- Migration creates the table with proper RLS policies

