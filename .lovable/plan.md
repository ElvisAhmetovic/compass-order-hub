## Stop Sending Invoice Payment Reminders to Team Emails

### What
The automated invoice payment reminder cron currently sends each reminder to:
1. The client (and any CC emails on the invoice) — in the client's language
2. **All 11 internal team emails** — in English

You want to stop step 2. The team will continue to monitor reminders inside the app (Payment Reminders page, reminder history, in-app notifications) — no more inbox spam.

### Why this is safe
- All reminder activity is already logged to the `invoice_payment_reminders` table and visible in the bell icon's reminder history.
- The Payment Reminders dashboard page already lists every overdue invoice.
- In-app payment reminder notifications already exist (`usePaymentReminderDueNotifications`).
- No other reminder flow (orders, manual sends, follow-ups) sends to the full team list, so this change is isolated.

### Changes

**File: `supabase/functions/send-invoice-payment-reminders/index.ts`**

1. Remove the `TEAM_EMAILS` constant (lines 10–22) — no longer used.
2. Remove the entire team-email send loop (lines 524–542) that iterates `TEAM_EMAILS` and sends a separate English email per team member.
3. Update the log line that reports counts to drop the team portion (just log client/CC delivery).
4. Update the `invoice_payment_reminders` log insert to set `sent_to_team: false` (line 558) so the audit trail correctly reflects that team emails were not sent.
5. Leave everything else untouched: client email, CC emails, language detection, reminder counter, `next_reminder_at` scheduling, paused/cancelled/paid skip logic, test mode.

**Redeploy**: the edge function must be redeployed for the change to take effect (the cron serves the last-deployed version).

### Out of scope
- Manual "Send Reminder" button in the Payment Reminders page (`send-payment-reminder` function) — already only emails the client, no team copy.
- Order payment reminders (`send-order-payment-reminders`, `send-client-payment-reminder`) — these are separate flows and don't blast the team list.
- The team notification email list constant in `src/constants/notificationEmails.ts` — still used by other features (orders, tech support) and should remain.

### Files modified
1. `supabase/functions/send-invoice-payment-reminders/index.ts` — remove team blast + redeploy.
