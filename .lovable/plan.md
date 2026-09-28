# Switch to a new Resend account safely

## Short answer
Yes. All 24 email functions read one stored key (`RESEND_API_KEY_ABMEDIA`) and send from `noreply@abm-team.com`. Nothing in the code is tied to the old account. So the switch is mostly setup work in Resend, and no code has to change.

## What could break it
1. **The sender domain is not verified in the new account.** Every email would be rejected. This is the main risk.
2. **The key is swapped before the domain is ready.** Emails would fail until verification finishes.
3. **Free-plan limits** (100 emails a day). The team notifications alone send 12+ emails per event.

## Safe order of steps
1. **You, in the new Resend account:** add `abm-team.com` and put its DNS records (DKIM, SPF) at the domain registrar. Keep the old account's records until the switch is finished. Wait until it shows "Verified".
2. **You:** pick a paid plan that allows the team's volume.
3. **You:** create an API key with "Sending access".
4. **Me:** open the secure form to replace the stored key. You paste the new key there.
5. **Me:** send one test email to your own address, not a client's. Then I check the send logs for the invoice PDF, work-hours reminder and password-change notices.
6. **Rollback if something fails:** put the old key back. It takes about a minute, and the old account keeps working until you delete it.

## Optional cleanup
- Remove the leftover fallback to the unused name `RESEND_API_KEY` in 5 functions, so there is only one key name.
- After a week without problems, remove the old DNS records and delete the old account.

## Technical details
- Secret: `RESEND_API_KEY_ABMEDIA`, replaced with `update_secret`. Edge functions read it on each call, so they pick up the new key without a redeploy.
- Sender: `AB Media Team <noreply@abm-team.com>` (29 places), unchanged.
- Email logs, bounce history and suppression lists stay in the old account and are not moved over.
