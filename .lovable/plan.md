

## Send Team Notification on Monthly Installment "Paid" / "Invoice Sent" Toggle

### What it does
When a team member toggles the "Paid" switch or the "Invoice Sent" switch on a monthly installment row, a notification email is sent to the standard team recipient list (12 people) informing them of the change, including client name, month, amount, and who made the change.

### Approach
Create a new edge function `send-monthly-toggle-notification` that accepts the toggle details and sends a branded email to the team list. Then call it from the existing toggle handlers in `MonthlyInstallmentsTable.tsx`.

### Changes

**1. New edge function: `supabase/functions/send-monthly-toggle-notification/index.ts`**
- Accepts: `{ clientName, clientEmail, monthLabel, amount, currency, toggleType: "paid"|"invoice_sent", newValue: boolean, changedBy: string }`
- Sends a branded HTML email to the hardcoded NOTIFICATION_EMAIL_LIST (same 12 recipients)
- Uses `RESEND_API_KEY_ABMEDIA` with sender `AB Media Team <noreply@abm-team.com>` (consistent with other monthly package emails)
- Batches 2 emails at a time with 1s delay (existing pattern)
- Subject: e.g. `[Monthly] Payment marked as Paid — ClientName — März 2026`

**2. `supabase/config.toml`** — Add `[functions.send-monthly-toggle-notification]` with `verify_jwt = false`

**3. `src/components/monthly/MonthlyInstallmentsTable.tsx`** — Update `handleToggleStatus` and `handleToggleEmailSent`
- After the successful toggle, fire-and-forget call `supabase.functions.invoke('send-monthly-toggle-notification', { body: { ... } })`
- Include the current user's name from AuthContext (need to accept `user` prop or use `useAuth`)
- Non-blocking: don't await or block the UI on email delivery

### Files
- **Create**: `supabase/functions/send-monthly-toggle-notification/index.ts`
- **Modify**: `supabase/config.toml` (add function config)
- **Modify**: `src/components/monthly/MonthlyInstallmentsTable.tsx` (add notification calls)
- **Modify**: `src/pages/MonthlyPackages.tsx` (pass `user` to the table component)

