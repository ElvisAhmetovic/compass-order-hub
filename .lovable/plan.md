# Fix ticket page layout and stop newsletter tickets

The screenshot shows two problems.

1. **Long links break the page.** The ticket's message box shows the email text as-is, so very long links push past the card's right edge.
2. **This is a newsletter, not a client reply.** It came from Auto1 to the reply address and opened a ticket anyway. Autorola and Sligro newsletters did the same thing today.

## Changes
1. **Ticket message wraps properly.** Long links and words break onto new lines inside the card, on the ticket detail page and in the Replies tab.
2. **Only real replies open tickets.** A reply opens a ticket only when it's linked to an offer, or when the sender's email matches a known client. Newsletters and bulk mail are recognised by their mailing-list headers ("List-Unsubscribe", "Precedence: bulk"). They're still stored under Replies, marked "Newsletter / not a reply", and they never open a ticket.
3. **Clean up today's junk tickets.** The tickets opened by newsletters that aren't linked to an offer (Auto1, Autorola, Sligro and similar) are set to "closed". Nothing is deleted. I'll show you the list before closing them.

## Technical details
- `CustomerTicketDetail.tsx` / `OutreachReplies.tsx`: add `break-words [overflow-wrap:anywhere]` to message text; `min-w-0` on the card.
- `_shared/outreachRules.ts`: new pure `shouldOpenTicket({ linkedToOffer, knownClient, headers })` plus `isBulkMail(headers)`, with unit tests (newsletter header → no ticket; linked offer → ticket; known client without offer → ticket; unknown sender, no offer → no ticket).
- `outreach-inbound`: call `shouldOpenTicket` before inserting into `customer_tickets`, and store the skip reason on the reply. Redeploy.
- Update the AGENTS.md rule "Every stored outreach reply opens one ticket" to the new condition.
- Data step: update `customer_tickets` with `outreach_reply_id` set, where the linked reply has `draft_id` null and the sender isn't a client → status closed. Show the affected rows first.
