# Send outreach and team replies from office@mediaamarketing.com

## Goal
Clients see "Media Marketing <office@mediaamarketing.com>" as the sender on the first outreach offer, the app's automatic follow-up, and every reply a team member writes in the app. When a client answers, the reply keeps going to the per-offer reply address, so it still shows up in Replies, opens a ticket, and gets forwarded to the team member who sent the offer. Nothing changes in how replies are routed.

## What changes
- First outreach offer: sender changes from noreply to office@mediaamarketing.com.
- Team replies written in the app: same sender change.
- Automatic fixed-template follow-up: uses the same office address, so all client-facing outreach mail looks the same.
- The test-send preview email uses the office address too.
- Forwarded copies that go to your own team inbox stay on noreply, because only the team sees them.
- Order, invoice and reminder emails are left as they are.

## Technical details
- Add `OUTREACH_FROM = "Media Marketing <office@mediaamarketing.com>"` in `supabase/functions/_shared/outreachRules.ts` and use it in `outreach-send` (send and test), `outreach-reply-send`, and the follow-up in `outreach-inbound`. Keep the `reply_to` value from `outreachReplyTo` as it is.
- mediaamarketing.com is already verified for sending in Resend, so no new DNS setup is needed.
- Add `office@mediaamarketing.com` to the internal or team address check, so a message sent from it is never handled as a client reply and can't cause a forwarding loop.
- Unit test: given an outreach send, the from header is OUTREACH_FROM and reply_to still has the per-offer address.
- Deploy outreach-send, outreach-reply-send and outreach-inbound. Update the memory note about the sender so it says outreach uses office@ and everything else uses noreply@.

## Note
If a client writes straight to office@mediaamarketing.com instead of pressing Reply, that message goes to the office mailbox and not to the app, so that mailbox needs to exist or forward somewhere.
