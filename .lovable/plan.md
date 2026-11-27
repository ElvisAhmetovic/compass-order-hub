# Auto-create a support ticket for every outreach reply

## What changes for the team
- When a client answers an AI outreach offer, a new ticket appears in Customer Tickets with status "open", right next to the reply in the outreach Replies inbox.
- Ticket subject: "Outreach reply: <client subject>"; message holds the client's reply text; notes say which offer it answers and who sent that offer (e.g. "Offer sent by Johann Nowak").
- The ticket is linked to the client's most recent order, so it opens in the usual order/client context.
- Each reply creates exactly one ticket, even if the email provider delivers it twice.
- Replies that can't be matched to an offer still get a ticket (marked "unmatched outreach reply") so nothing is missed.

## Why no AI step
Creating the ticket is a fixed rule, not an AI decision, so it happens instantly and reliably for every reply. The assistant can already read and update these tickets ("show today's outreach tickets", "close ticket X") as before.

## Technical details
- `supabase/functions/outreach-inbound/index.ts`: after storing the reply in `outreach_replies`, create the `customer_tickets` row with the service client. Look up the draft (client_id, client email/name, company, approved_by_name, offer subject) and the client's latest non-deleted order for `order_id`.
- `customer_tickets.order_id` is currently required. Migration: make `order_id` nullable so replies from clients without an order (or unmatched replies) still get a ticket; add `outreach_reply_id uuid unique` referencing `outreach_replies(id)` to guarantee one ticket per reply (idempotent on retry). Existing RLS (team-only) stays unchanged.
- Check the Customer Tickets page and `customerTicketService.ts` handle a missing order (show "No order" instead of breaking).
- Pure helper `buildOutreachTicket(reply, draft)` in `_shared/outreachRules.ts` with unit tests: subject/notes wording, sender name in notes, unmatched case, length limits.
- Deno tests for outreach-inbound stay green (signature still required, 401 unsigned). Redeploy outreach-inbound.
- Reminder: replies only start arriving once the Resend receiving domain, MX record and webhook secret steps from earlier are done.
