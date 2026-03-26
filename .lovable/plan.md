

## Remove johan@team-abmedia.com from Invoice Reminder & Offer Notifications

### What
Johan wants to stop receiving:
1. **Invoice payment reminder emails** (automated and manual)
2. **Internal offer notification emails** (when team sends an offer to a client)

### Files to modify

Remove `johan@team-abmedia.com` from the notification list in these specific edge functions:

**Invoice/Payment Reminders:**
1. `supabase/functions/send-invoice-payment-reminders/index.ts` — automated invoice reminders
2. `supabase/functions/send-order-payment-reminders/index.ts` — order payment reminders
3. `supabase/functions/send-client-payment-reminder/index.ts` — client payment reminders
4. `supabase/functions/send-invoice-pdf/index.ts` — invoice PDF team copy

**Offer Notifications:**
5. `supabase/functions/send-offer-email/index.ts` — when offer is sent to client
6. `supabase/functions/confirm-offer/index.ts` — when offer is confirmed

Each file: remove the line `"johan@team-abmedia.com"` from the `NOTIFICATION_EMAIL_LIST` array.

Johan stays on other notification lists (tech support tickets, monthly contracts, follow-up reminders, client tickets, etc.).

