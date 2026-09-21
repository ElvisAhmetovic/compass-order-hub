# Protect internal notes in the Create Order flow

## What I found

Inside the Create New Order window there are two text boxes:

- **Client Description** — meant for the client (shows in offers, proposals, invoices). Works correctly: it is saved on the order, copied into the offer, shown in the offer email, and carried into the created order.
- **Internal Notes** — meant for the team only. Saving works, but there are three places where these private notes can reach someone outside the team.

### Issue 1 — Internal notes are included in the order confirmation email
The confirmation email sent when an order is created contains a yellow "Internal Notes" block. That email goes to the fixed team addresses **plus any address typed into "Additional Email Notifications"**. If a colleague ever types the client's address there (a normal thing to do), the client receives the private notes.

### Issue 2 — Internal notes travel inside the offer record and are returned to the public offer page
When an offer is sent, the internal notes are stored inside the offer's extra data. The public offer page (the link the client opens to accept) asks the server for the offer and the server returns the **whole** record, including those notes. They are not displayed on screen, but they are present in the data the client's browser receives and anyone who opens the link can read them.

### Issue 3 — Internal notes appear in status-change notification emails
Those emails go to a configurable recipient list. If a client address is ever added to that list, the same leak happens.

Confirmed safe: the client portal order list already excludes internal notes.

## Plan

1. **Order confirmation email** — keep the Internal Notes block only for the fixed team addresses; strip it from any email sent to an extra address that is not a team address. Client Description stays in all versions.
2. **Public offer lookup** — return only the fields the offer page needs (client details, company, description, price, currency, VAT, expiry, confirmation state) instead of the whole record, so the private notes never leave the server. Accepting an offer still copies the notes onto the new order internally.
3. **Status-change notification email** — same treatment as step 1: internal notes only for known team addresses.
4. **Modal wording** — keep the existing "not visible to clients" hint and add a short warning next to the additional-emails box that anything added there receives the order confirmation.
5. Re-run type checks and the test suite; add small tests covering "internal notes are removed for non-team recipients" and "the public offer response contains no internal notes".

## Technical notes

- `supabase/functions/send-order-confirmation/index.ts`: build the HTML per recipient; include the internal-notes section only when the recipient is in the hardcoded team list.
- `supabase/functions/send-status-change-notification/index.ts`: same per-recipient gating against the team list.
- `supabase/functions/confirm-offer/index.ts`: replace `select('*')` in the `fetch` action with an explicit safe field list (and sanitise `order_data` down to `vatEnabled`, `vatPercentage`, `netPrice`).
- `src/components/dashboard/CreateOrderModal.tsx`: presentation-only helper text inside the collapsible email section.
- No database or schema changes; no change to how notes are stored or how orders/offers are created.
