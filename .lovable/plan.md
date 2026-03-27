

## Change Reminder Toggle Icon to Avoid Confusion

### Problem
The "Reminders Active / Click to Pause" toggle button uses the same `Bell` icon as the "Reminders Sent" column header, making them visually indistinguishable.

### Solution
Replace the reminder toggle icons with `Timer` (active) and `TimerOff` (paused) from lucide-react. This clearly differentiates the pause/resume action from the reminder history indicator.

### File to modify
**`src/pages/Invoices.tsx`**
- Replace `Bell` import with `Timer` and `BellOff` with `TimerOff`
- Update the toggle button: show `Timer` when active, `TimerOff` when paused
- Keep the `Bell` icon only for the "Reminders Sent" column header

