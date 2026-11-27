# Show the client's business on every outreach reply

## Today
- Replies tab: the business name appears only inside the small "Offer sent by…" badge, and only when the reply is matched to an offer.
- Ticket: gets the business name only from the matched offer; unmatched replies have none.

## Change
- Every reply gets a business name, found in this order:
  1. the offer it answers,
  2. the client record with that email address,
  3. the company record with that email address,
  4. the business on the client's latest order with that contact email.
- The Replies list shows the business name in bold as the first line (e.g. **Zahnarztpraxis Müller**), with the person and email underneath; "Unknown business" when nothing matches.
- The search box also finds replies by business name.
- The auto-created ticket uses the same business name, so Customer Tickets shows it too.

## Technical details
- Migration: add `company_name text` to `outreach_replies` (team-only RLS unchanged).
- `outreach-inbound`: shared `resolveReplyCompany(db, draft, email)` lookup (draft → `clients.email` → `companies.email` → latest non-deleted `orders.contact_email` → `company_name`, case-insensitive); store on the reply and pass to `buildOutreachTicket` (draft company falls back to the resolved one).
- Pure helper `pickCompanyName(...candidates)` in `_shared/outreachRules.ts` with unit tests (order of priority, blanks skipped, null when none).
- `OutreachReplies.tsx`: show `company_name` (fallback: offer's company) as the heading; include it in search.
- Optional one-time fill of existing replies: currently none have arrived, so not needed.
- Redeploy `outreach-inbound`; Deno tests stay green.
