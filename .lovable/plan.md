

## Add Confirmation Modals to Invoice Actions

### What
Add AlertDialog confirmation modals to three buttons in the Invoices page to prevent accidental clicks:
1. **Confirm Payment Received** (green checkmark) — "Are you sure this payment has been received?"
2. **Delete Invoice** (trash icon) — "Are you sure you want to delete this invoice?"
3. **Toggle Reminders Pause/Resume** (bell icon) — "Are you sure you want to pause/resume reminders?"

### How

**File: `src/pages/Invoices.tsx`**

All three buttons already exist inline. Wrap each with an `AlertDialog` (already imported in the project via `@/components/ui/alert-dialog`).

1. **Confirm Payment Received** (lines 537-570): Wrap in AlertDialog with trigger on the green CheckCircle2 button. Dialog text: "Confirm Payment Received — Are you sure the payment for {invoice_number} has been received? This will mark the invoice as paid and notify the client." Action button: green "Yes, Payment Received".

2. **Delete Invoice** (lines 580-587): Wrap in AlertDialog. Dialog text: "Delete Invoice — Are you sure you want to delete {invoice_number}? This action cannot be undone." Action button: red "Delete Invoice".

3. **Reminder Toggle** (lines 512-533): Wrap in AlertDialog. Dialog text changes based on current state — "Pause Reminders" or "Resume Reminders" with appropriate description. Action button: "Yes, Pause" or "Yes, Resume".

Add state variables to track which invoice is pending each action, or use the AlertDialog's built-in open/close pattern with `AlertDialogTrigger asChild`.

### Technical Details
- Import `AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger` from `@/components/ui/alert-dialog`
- Each action button becomes an `AlertDialogTrigger asChild` wrapping the existing button
- The actual handler logic moves into the `AlertDialogAction` onClick
- No new files needed — single file edit

### Files to modify
1. `src/pages/Invoices.tsx` — Wrap three buttons with AlertDialog confirmation modals

