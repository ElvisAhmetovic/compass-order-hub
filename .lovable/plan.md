# Add Ikram to all team notification lists

New admin `Ikram@team-abmedia.com` must receive every email the rest of the team currently receives (orders, offers, tickets, payment reminders, invoices, monthly contracts, work-hours reminders, follow-ups, etc.).

## What changes

### 1. Central constants
- `src/constants/notificationEmails.ts` — add `Ikram@team-abmedia.com` to `NOTIFICATION_EMAIL_LIST`.

### 2. Edge functions with hardcoded recipient arrays
Add `Ikram@team-abmedia.com` to the recipient list in each of these:
- `supabase/functions/confirm-offer/index.ts`
- `supabase/functions/create-client-ticket/index.ts`
- `supabase/functions/create-tech-support-ticket/index.ts`
- `supabase/functions/generate-monthly-installments/index.ts`
- `supabase/functions/send-client-payment-reminder/index.ts`
- `supabase/functions/send-client-portal-credentials/index.ts`
- `supabase/functions/send-follow-up-reminders/index.ts`
- `supabase/functions/send-invoice-pdf/index.ts`
- `supabase/functions/send-monthly-contract-created/index.ts`
- `supabase/functions/send-monthly-toggle-notification/index.ts`
- `supabase/functions/send-offer-email/index.ts`
- `supabase/functions/send-order-payment-reminders/index.ts`
- `supabase/functions/send-payment-confirmation/index.ts`
- `supabase/functions/send-workhours-daily-reminder/index.ts`
- `src/services/orderService.ts` (if it has a local list — will check and update if so)

### 3. Database
- Update the single row in `notification_settings.recipient_emails` (id `bd7ee53f-…`) to append `Ikram@team-abmedia.com`. Done via the insert/update tool (data change, not schema).

## What is NOT changed
- `notify-password-change/index.ts` — recipients are only the two senior admins (Thomas/Stefan). Per existing pattern, plain-text password resets stay limited to primaries. Skipped unless you want Ikram in there too.
- The existing exclusion for `johan@team-abmedia.com` from financial emails is johan-specific and stays as-is. Ikram is included everywhere by default.
- Old migration files under `supabase/migrations/` are historical snapshots and won't be edited.

## Verification
After deploy: trigger one order-created and one work-hours reminder, confirm Ikram receives both. Confirm `notification_settings.recipient_emails` includes the new address.

Confirm:
1. Add Ikram to **all** team lists (default behavior above), and
2. Whether to also add Ikram to `notify-password-change` (currently only 2 senior admins).
