# Change notification sender domain to empriatech.com

## Problem
Notification emails (e.g. "Client Password Changed") are sent from `noreply@empriadental.de` — the old dentistry domain. They should come from the company domain `empriatech.com`.

## Changes (6 edge functions, one line each)
Replace the `from` address `noreply@empriadental.de` with `AB Media Team <noreply@empriatech.com>` in:

1. `supabase/functions/notify-password-change/index.ts` (line 41 — the email from your screenshot)
2. `supabase/functions/send-order-confirmation/index.ts` (line 332)
3. `supabase/functions/send-status-change-notification/index.ts` (line 211)
4. `supabase/functions/send-service-delivered-notification/index.ts` (line 197)
5. `supabase/functions/send-tech-support-notification/index.ts` (line 303)
6. `supabase/functions/send-support-inquiry-notification/index.ts` (line 205)

Then redeploy all 6 functions.

## Important prerequisite — you must do this in Resend
`empriatech.com` must be a **verified domain in your Resend account**, otherwise every email sent from it will fail.

Steps (in your Resend dashboard):
1. Domains → Add Domain → `empriatech.com`
2. Add the DNS records Resend shows (DKIM TXT records, plus optional SPF/MX) at your domain registrar for empriatech.com
3. Wait for the domain status to show "Verified"

Only `empriadental.de` and `abm-team.com` appear to be verified today, so this step is very likely needed.

## Verification after the change
- Trigger a test send (e.g. change a test client's password) and confirm the email arrives from `noreply@empriatech.com`.
- If Resend rejects the send (domain not verified), the error will be surfaced so we know DNS setup is incomplete.

## Rollback
If empriatech.com can't be verified quickly, we can temporarily point all 6 senders to `noreply@abm-team.com` (already verified) and switch later — one-line change each.
