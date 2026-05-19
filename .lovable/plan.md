# Daily Work Hours Reminder (Bosnian, 09:30)

Send a daily email to every team member at **09:30 Europe/Sarajevo, Monday–Friday**, reminding them to submit their work hours in empriatech. The message tells them that if they fail to submit by 12:00, they must contact **Selmin** or **Elvis**.

## What gets built

1. **New edge function**: `send-workhours-daily-reminder`
   - Skips weekends (Sat/Sun) in Europe/Sarajevo timezone.
   - Pulls all team recipients from `NOTIFICATION_EMAIL_LIST` (`src/constants/notificationEmails.ts`) — same 12-member list used for other team notifications.
   - Sends one email per recipient via Resend, serialized at **2/sec** to respect rate limits (consistent with project memory).
   - From: `AB Media Team <invoice@team-abmedia.com>` (primary team sender).
   - Subject (Bosnian): `Podsjetnik: Unesite radne sate do 12:00`
   - HTML body in Bosnian, branded, with a direct CTA button linking to `https://empriatech.com/work-hours`.
   - Returns counts sent / failed for logging.

2. **Cron schedule** via `pg_cron` + `pg_net`:
   - Runs every weekday at **08:30 UTC** (= 09:30 Sarajevo in standard time; Sarajevo is UTC+1 winter / UTC+2 summer — see "Open question" below).
   - Calls the edge function with the project anon key.

3. **Manual trigger button (optional, admin only)** on `WorkHoursAdmin`:
   - "Send reminder now" button visible to super admins, invokes the function on demand for testing.

## Email content (Bosnian draft)

> **Subject:** Podsjetnik: Unesite radne sate do 12:00
>
> Dobro jutro,
>
> Molimo Vas da unesete svoje radne sate u empriatech sistem što prije.
>
> **Rok za unos je danas do 12:00.**
>
> Ukoliko ne unesete radne sate do 12:00, morat ćete kontaktirati **Selmina** ili **Elvisa** kako bi se unos odobrio naknadno.
>
> [Unesi radne sate »](https://empriatech.com/work-hours)
>
> Hvala,
> AB Media Team

## Technical details

- **Files**:
  - `supabase/functions/send-workhours-daily-reminder/index.ts` (new)
  - SQL insert (not migration) for the cron schedule
  - `src/pages/WorkHoursAdmin.tsx` (small "Send reminder now" button for super admins)
- **Secrets**: uses existing `RESEND_API_KEY` and `APP_URL`. No new secrets needed.
- **Rate limiting**: 500ms delay between sends (2/sec), matching existing patterns.
- **Weekend skip**: function checks `getDay()` in Europe/Sarajevo and exits early on Sat/Sun, so even if cron fires it's a no-op.
- **Recipients**: reuses `NOTIFICATION_EMAIL_LIST`. If you want a different list (e.g. only workers, excluding management), say so and I'll split it.

## Open questions

1. **Recipient list** — use the existing 12-member `NOTIFICATION_EMAIL_LIST`, or a different list of just the workers who actually submit hours?
2. **Daylight saving** — Sarajevo shifts between UTC+1 and UTC+2. Options:
   - (a) Fixed cron at `30 8 * * 1-5` UTC → correct in winter, fires at 10:30 local in summer.
   - (b) Two cron entries that I swap manually each DST change.
   - (c) Run cron every 15 minutes and let the edge function check local time exactly (most robust — recommended).
3. **Manual "Send now" button** in admin panel — include it, or skip?
