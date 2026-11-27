# Replies: delete, bulk select, and two-way email inside the app

## 1. Delete replies (one or many)
- Each reply in the Replies tab gets a checkbox, and there's a "Select all" box at the top (it only selects what's shown, so it respects the search).
- When at least one reply is ticked, a bar appears: "**N selected** · Mark read · Delete".
- Each reply opened up also has its own **Delete** button.
- Delete always asks first: "Delete N replies? This can't be undone. Their tickets stay." Tickets made from deleted replies stay in Customer Tickets; only the link to the reply goes.
- The tab label shows the **total** number of replies, with unread ones in brackets, for example "Replies 12 (3 new)". Today it only counts unread replies, which is why it says 0.
- Any team member (admin or agent) can delete.

## 2. Reply to clients from the app (two-way conversation)
- Opening a reply shows the **whole conversation** with that client for that offer, oldest first. That's the original offer, their replies and your answers, each with who sent it, the date and the time.
- Below it there's a **"Write a reply"** box with subject (pre-filled "Re: …") and message, and a **Send** button. "Reply by email" stays as a backup.
- Your answer goes out the same way as the offer: from Media Marketing, with the per-offer reply address. When the client answers again, it lands back in this same conversation. They can go back and forth as often as they like.
- Your name is added as "Your contact: <name>" and the usual contact line and unsubscribe link are kept, same as the offer.
- These are written by a team member and sent by a click, so the rule "no AI email without human review" stays intact. No AI text is involved.
- Blocked when the client has opted out of offers (with a clear message).
- For replies not linked to an offer, the answer still sends, and the client's next email is matched to them by email address.

## Technical details
- Migration:
  - `outreach_replies`: add DELETE policy `is_team()`; `GRANT DELETE` to authenticated.
  - New table `outreach_messages` (id, draft_id null, reply_id null, to_email, subject, body, sent_by, sent_by_name, resend_id, status sent/failed, error, created_at), with grants, RLS on, and team read only. Inserts happen only from the edge function using the service role.
- New edge function `outreach-reply-send`:
  - Verifies the JWT and requires `is_team`; 401/403 tests.
  - Zod-validates `{ reply_id, subject, body }`, rejects opted-out recipients, sends via Resend (`RESEND_API_KEY_ABMEDIA`) from `Media Marketing <noreply@mediaamarketing.com>`, `reply_to` from `outreachReplyTo(...)`, and adds the `[Ref XX-AO]` subject tag.
  - Records the result in `outreach_messages`, and returns the provider error on failure.
- Shared helper `renderOutreachHtml()` moved into `_shared/outreachRules.ts`, used by both `outreach-send` and `outreach-reply-send` so the layout stays identical. Unit test for the rendering and the opt-out block.
- UI: `OutreachReplies.tsx` adds a selection state, a bulk bar, delete with confirm (AlertDialog), a conversation thread (the draft, plus `outreach_replies` and `outreach_messages` by draft_id or by email when unlinked), and a composer. `AiOutreach.tsx` shows the tab count as total plus new.
- AGENTS.md: add a rule that team replies to clients go only through `outreach-reply-send` (human-written, opt-out checked).
