

## Add Multiple CC Emails for Invoice Payment Reminders

### What
On the bell icon dialog (Payment Reminders) for each invoice, add an editable list of additional email addresses. The automated reminder cron will send the client-facing reminder to the primary contact **plus** all additional emails in one go (CC), so clients with multiple inboxes always receive it.

### Where
- Bell icon → opens `InvoiceReminderHistory` dialog → new section **"Additional CC Emails"** above the reminder log.

### UI behavior
- Shows existing CC emails as removable chips/badges.
- Input field + "Add" button to add a new email (validated as proper email format, deduped, max 10).
- Save persists immediately to the invoice row.
- Subtle helper text: *"These addresses will be CC'd on every automated payment reminder for this invoice."*

### Data
New column on `invoices`:
- `cc_emails text[] not null default '{}'`

(No RLS policy changes needed — existing invoice policies cover it. The column is nullable-safe via default empty array.)

### Backend (cron)
In `supabase/functions/send-invoice-payment-reminders/index.ts`:
- When sending the **client** reminder, build the recipient list as `[clientEmail, ...invoice.cc_emails]` (deduped, lowercased).
- Send as a single Resend call using `to: [primary]` and `cc: extras` so the client sees fellow recipients (transparent), or alternatively `to: [...all]` if we want each recipient hidden from the others. **Default: use `cc` (transparent)** — matches typical client-comms behavior.
- Log the full recipient list into `invoice_payment_reminders.sent_to_client` as a comma-separated string so the history dialog reflects all addresses.

### Files to modify
1. **DB migration** — add `cc_emails text[] default '{}'` to `invoices`.
2. **`src/components/invoices/InvoiceReminderHistory.tsx`** — add CC manager UI (chips + input + add/remove + save to Supabase).
3. **`supabase/functions/send-invoice-payment-reminders/index.ts`** — read `cc_emails`, include in client reminder send, update log entry. Redeploy.

### Out of scope
- The "Send Now" manual reminder button on the overdue list (`PaymentReminders.tsx`) — current request is only for the bell icon flow. Easy to extend later if wanted.

