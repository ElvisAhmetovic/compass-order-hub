# Fix: Send Reminder Now returns 0/12

The daily work-hours reminder edge function sends 0/12 because it uses the wrong Resend API key and sender domain.

## Cause

`send-workhours-daily-reminder` currently uses:
- `RESEND_API_KEY` (scoped to `empriadental.de`)
- `from: invoice@team-abmedia.com` (NOT verified in Resend)

Every other team-wide notification in the project uses:
- `RESEND_API_KEY_ABMEDIA`
- `from: AB Media Team <noreply@abm-team.com>` (the verified Resend sender for team/financial emails — matches the project memory note about Resend domain separation)

## Fix

In `supabase/functions/send-workhours-daily-reminder/index.ts`:
1. Switch the env var to `RESEND_API_KEY_ABMEDIA`.
2. Change the `from` to `AB Media Team <noreply@abm-team.com>`.
3. Log Resend's response body on failure so future issues show up in edge function logs (instead of only in the response payload).

No DB changes, no cron changes. After redeploy, "Send reminder now" should report 12/12.
