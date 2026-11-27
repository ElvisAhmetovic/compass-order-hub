# Forward client replies to the team member who sent the offer

## What changes
1. **Reply forwarded to the sender's inbox.** When a client answers an offer, the reply still lands in Replies. It is also emailed to the team member who approved and sent that offer, at their account email.
   - The forwarded email has the subject "Client reply: <subject> – <business>", and opens with "<Client> replied to your offer from <date>". Then come the client's message and a "Open in Empria" link to the conversation.
   - **Answering it from Gmail works too.** If the team member clicks Reply in their own mail program, the answer goes to the client, and a copy also comes back into the app's conversation under the team member's name. Their own mailbox address shows to the client in that case. Answering from inside the app keeps the Media Marketing sender.
2. **Who's talking is always shown.** In the conversation on Replies and on the client profile, each message is labelled with the client's name or the team member's name: "Max Pfenning (offer)", "Max Pfenning", "Client: Anna Müller". An "Offer sent by <name>" badge already exists.
3. **Not forwarded:** newsletters, automatic replies, and replies that aren't linked to an offer. Those stay in Replies only, because there's no single owner.
4. **Settings → nothing to set up.** The address used is each person's login email.

## Account emails (checked)
Every team account has a login email, so none are missing. The ones that sent offers so far:

| Team member | Offers sent | Replies will go to |
|---|---|---|
| Johann Nowak | 113 | business@team-abmedia.com |
| Suzie Mckenna | 3 | marcusabmedia@gmail.com |
| Max Pfenning | 2 | luciferbebistar@gmail.com |
| Thomas Klein | 1 | kontakt.abmedia@gmail.com |
| Stefan Wolf | 1 | wolfabmedia@gmail.com |

luciferbebistar@gmail.com belongs to the **Max Pfenning** account, so if that's you, your replies go there.

## Note on older offers
Offers sent before today already pointed replies at the sender's own email as well as invoice@. Those replies are in those mailboxes, not in the app.

## Technical details
- `outreach-inbound`: load `approved_by` with the draft, and resolve the email via `auth.admin.getUserById` (service role, server-only). After storing, when linked, not bulk, not an auto-reply and not from a team address, send via Resend from `Media Marketing <noreply@mediaamarketing.com>` to that email, with `reply_to: [client email, reply+<draftId>@replies…]`. Record `forwarded_to` and `forwarded_at` on `outreach_replies` (idempotent: only when `forwarded_at` is null).
- Inbound mail **from a team member's address** (their Gmail answer CC'd to the reply address) is stored with `is_team=true`. It opens no ticket, gets no follow-up and isn't forwarded, and is shown as an outgoing message with the team member's name.
- Migration: `outreach_replies` gets `forwarded_to text`, `forwarded_at timestamptz`, `from_team_user uuid`.
- Pure helpers in `_shared/outreachRules.ts`: `shouldForwardReply({linked, bulk, autoReply, fromTeam, alreadyForwarded})` and `renderForwardEmail(...)`, with unit tests.
- `ReplyConversation.tsx` / `clientTimeline.ts`: render team-sent inbound as outgoing with the member's name, and prefix client messages with "Client:".
- AGENTS.md rule: replies are forwarded only to the offer's approver via `outreach-inbound`, once.
