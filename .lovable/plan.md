# Conversation history on each client profile

A new **"Conversation history"** card on the client profile (`/clients/:id`) shows every email with that client in one timeline, newest first.

## What it shows
Each entry shows the direction (sent / received), the date and time, the subject, who sent it, and the message when the app keeps it. Click an entry to open the full text.

| Type | Direction | Message text kept? |
|---|---|---|
| AI outreach offers that were sent | Sent | Yes |
| Client replies to offers | Received | Yes |
| Team answers sent from Replies | Sent | Yes |
| Order and invoice emails (order confirmations, invoices, custom emails) | Sent | Subject and custom message only |
| Order status update emails | Sent | Subject only |

- **Filters:** All · Sent · Received · Outreach · Orders & invoices.
- **Write a reply:** a button opens the same reply box as on the Replies tab. It's available when the client has an outreach conversation, and the answer then shows up in this history too.
- Emails are matched by the client's email address, so emails from before today show up as well.
- When something fails to load, a "Retry" card appears instead of an empty list.

## Not included
- Emails people sent or received in their own mail programs (Gmail, Outlook, invoice@ mailbox). The app never saw those. The forwarding or inbox-connection options from my last answer would add them later.
- Wording of older order/invoice emails that wasn't stored at the time. Those show the subject only.

## Technical details
- No database changes. Read-only queries (team RLS already in place) on `outreach_drafts` (status sent, `email`), `outreach_replies` (`from_email`), `outreach_messages` (`to_email`), `client_email_logs` (`sent_to`), and `notification_logs` (`recipient_emails` contains email), all case-insensitive.
- New pure helper `src/lib/clientTimeline.ts` `buildClientTimeline(sources)` → sorted, typed entries; unit tests for merge order, direction and filter.
- New `src/components/clients/ClientConversationHistory.tsx` (useQuery keyed by email, filters, expandable entries, reuses `ReplyConversation` composer for the latest outreach reply).
- `ClientProfile.tsx`: add the card under Notes; the existing small "Replies" list is folded into it.
- AGENTS.md: client conversation history is built from existing email logs via `buildClientTimeline`, with no copied email table.
