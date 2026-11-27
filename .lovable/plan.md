# Remove the 50-offers-per-day limit

## Current state (checked)
- Sending an offer is refused once 50 offers were sent the same day ("Daily limit of 50 offer emails reached.").
- The AI Outreach page shows "Sent today: X/50".

## Changes
1. Sending no longer checks a daily count — any number of approved offers can go out per day.
2. The page shows "Sent today: X" (no "/50").
3. Unchanged: weekday 09:00–17:00 window, human approval for every offer, opt-out and unpaid-invoice checks, the sending pace that keeps the email provider within its per-second rate.

## Technical details
- `outreach-send`: drop the sentToday query and quota check; redeploy.
- `_shared/outreachRules.ts`: remove `DAILY_SEND_LIMIT` and `remainingDailyQuota`; drop their unit test in `src/utils/__tests__/outreachRules.test.ts`.
- `src/pages/AiOutreach.tsx`: label text only.

## Note
- Sending many cold-ish emails in one day from office@ can hurt deliverability (spam folders). No limit is enforced after this change.
