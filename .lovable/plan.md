

## Add johan@team-abmedia.com to All Team Email Lists

There are 6 files with hardcoded team email lists. The new email needs to be added to each one.

### Changes

1. **`src/constants/notificationEmails.ts`** — Add `'johan@team-abmedia.com'` to the array
2. **`supabase/functions/send-client-payment-reminder/index.ts`** — Add `"johan@team-abmedia.com"` to `TEAM_EMAILS`
3. **`supabase/functions/send-order-payment-reminders/index.ts`** — Add `"johan@team-abmedia.com"` to `TEAM_EMAILS`
4. **`supabase/functions/create-tech-support-ticket/index.ts`** — Add `'johan@team-abmedia.com'` to `DEFAULT_EMAILS`
5. **`supabase/functions/create-client-ticket/index.ts`** — Add `'johan@team-abmedia.com'` to `NOTIFICATION_EMAILS`
6. **`src/services/orderService.ts`** — Add `johan@team-abmedia.com` to the comma-separated default emails string

All additions will be appended at the end of each list, before the closing bracket/quote. Three edge functions will need redeployment after the change.

