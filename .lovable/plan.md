# AI Outreach reply inbox

## Spec
- Given an approved outreach offer was sent by Johann Nowak, when the client clicks Reply, then the reply appears in the app's new "Replies" inbox with sender, subject, date, the message text, and "Offer sent by Johann Nowak".
- Given a reply arrives, then the original sender also still gets an email copy, so nobody has to check the app constantly.
- Given an email arrives that does not match any offer, then it is still shown in the inbox, marked "Not linked to an offer".
- Only team members (admin/agent) can see the inbox; clients and other accounts cannot.

## What changes for you
1. One-time setup (your side): in Resend, turn on receiving for `replies.mediaamarketing.com`, then add the MX record Resend shows at your domain provider. I will give exact steps.
2. Offer emails get a reply address that includes the offer's code, e.g. `reply+<code>@replies.mediaamarketing.com`, so every reply is matched to its offer and sender. Your "[Ref JN-AO]" subject tag and "Your contact" line stay.
3. New "Replies" tab on the AI Outreach page: list (sender, subject, date, offer sender, unread dot), click to read the full message, mark read, link to the client.
4. Unread count badge on the AI Outreach menu item.

## Technical details
- New table `outreach_replies` (draft_id nullable, from_email, from_name, subject, text_body, html_body, received_at, read_at, read_by, provider_message_id unique). Team-only RLS via `is_team()`; inserts only by the server.
- New edge function `outreach-inbound`: public endpoint, verifies Resend webhook signature (new secret `RESEND_INBOUND_WEBHOOK_SECRET`), handles `email.received`, fetches full content from Resend, parses `reply+<id>` to link the draft, idempotent on message id, forwards a copy to the offer sender. Tests: bad/missing signature rejected (401), duplicate ignored, matching/unmatched address.
- `outreachRules.ts`: `outreachReplyTo` returns the plus-address; unit tests updated.
- Frontend: Replies tab + reader in `AiOutreach.tsx`, gated by `isTeamRole`.
- Replies arriving before the MX record exists still go to invoice@ as today (fallback kept until setup is confirmed).
