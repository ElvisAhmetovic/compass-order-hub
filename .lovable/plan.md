

## Replace `kleinabmedia@gmail.com` with `invoice@team-abmedia.com` Across All Team Email Lists

### What
Remove `kleinabmedia@gmail.com` from every hardcoded team notification list across the entire codebase and replace it with `invoice@team-abmedia.com`.

### Scope
17 files contain this email — 1 frontend constant, 1 service file, 1 old migration (read-only, skip), and 14 edge functions. The `notify-password-change` function has a separate `kleinabmedia1@gmail.com` (different email, different purpose) — that one stays untouched.

### Files to modify (16 total)

**Frontend (2 files):**
1. `src/constants/notificationEmails.ts` — replace `kleinabmedia@gmail.com` → `invoice@team-abmedia.com`
2. `src/services/orderService.ts` — same replacement in the fallback email string

**Edge Functions (14 files):**
3. `supabase/functions/create-tech-support-ticket/index.ts`
4. `supabase/functions/send-invoice-payment-reminders/index.ts`
5. `supabase/functions/send-client-payment-reminder/index.ts`
6. `supabase/functions/send-offer-email/index.ts`
7. `supabase/functions/send-payment-confirmation/index.ts`
8. `supabase/functions/send-order-payment-reminders/index.ts`
9. `supabase/functions/send-invoice-pdf/index.ts`
10. `supabase/functions/generate-monthly-installments/index.ts`
11. `supabase/functions/send-client-portal-credentials/index.ts`
12. `supabase/functions/send-follow-up-reminders/index.ts`
13. `supabase/functions/send-monthly-contract-created/index.ts`
14. `supabase/functions/confirm-offer/index.ts`
15. `supabase/functions/create-client-ticket/index.ts`
16. `supabase/functions/send-monthly-toggle-notification/index.ts`

Each file: simple find-and-replace of `kleinabmedia@gmail.com` → `invoice@team-abmedia.com`. Then redeploy all 14 edge functions.

The old migration file (`20251105151028_...`) is already applied and won't be touched.

