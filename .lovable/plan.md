

## Add "Reschedule" Button to Sent/Past Reminders

### What
When a follow-up reminder has been sent (e.g. you called but nobody picked up), add a "Reschedule" button next to the delete button on past reminders. Clicking it opens a small dialog where you only pick a **new date and time** — all other details (company name, phone, note, assignee) are kept from the original reminder. A new scheduled reminder is created with the same info.

### How

**File: `src/pages/Reminders.tsx`**

1. Add a `rescheduleReminder` state (`Reminder | null`) to track which reminder is being rescheduled
2. Add a `rescheduleDate` and `rescheduleTime` state for the new date/time
3. Add a `RefreshCw` icon import from lucide-react
4. On each **past reminder** card (sent/failed), add a "Reschedule" button (next to delete) with `RefreshCw` icon
5. Clicking it sets `rescheduleReminder` to that reminder and opens a Dialog
6. The Dialog shows:
   - Company name (read-only, displayed as text)
   - Date picker and time input (only fields to fill)
   - Optional: ability to append to the existing note
7. On submit: insert a new `follow_up_reminders` row with the same `company_name`, `contact_phone`, `note` (optionally appended), `assignee_email`, `assignee_name`, but new `remind_at` and `status: 'scheduled'`
8. Toast confirmation, close dialog

This way you never re-enter company/phone/notes — just pick a new time.

### Files to modify
1. `src/pages/Reminders.tsx` — Add reschedule state, dialog, and handler

