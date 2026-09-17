# Customer tickets: real content, auto-linking, and access

## What's wrong today (verified)

The M3 Auto ticket (M3 AUTO LEASING, info@m3auto.dk, 17.09.2026) really does contain nothing beyond the company, email, order and "Open" status — because that's all the system ever stores. The client just clicks a "need support" link in an email, and the ticket is created instantly with no message from them.

Three separate problems:

1. **No information.** There is no field anywhere for the client's actual problem, so every ticket looks identical.
2. **Nothing is linked automatically.** The order for M3 Auto has no portal account attached, and there is no portal user for info@m3auto.dk at all. The assign box lists all 42 portal users from every other company, with no match and no hint.
3. **Some members can't assign.** Only people marked admin or agent can open or assign these tickets. Everyone else is blocked, both on the page and in the database.

## What we'll change

### 1. Clients describe their problem
The support link now opens a short page where the client writes what they need help with (and optionally a subject) before submitting. The message is stored on the ticket and shown at the top of the ticket page, and included in the team notification email.

Existing tickets without a message will show "No description provided (submitted before the form existed)".

### 2. Automatic linking
When a ticket comes in, the system looks for a portal account with the same email and links it right away. The team notification says whether it linked or not. Manual assign and unassign stay available.

### 3. When there's no portal account (the M3 Auto case)
The ticket page shows a clear notice that this client has no portal login, plus a button that creates the account and emails the login details to the client's address, using the existing credential-sending flow. After it succeeds, the ticket links to the new account automatically.

### 4. Everyone on the team can handle tickets
Viewing, updating, assigning and unassigning tickets opens up to all logged-in team members. Deleting stays admin-only.

### 5. More context on the ticket page
The ticket page also shows the linked order's details — order number/company, contact person, order status and value — with a link to open the full order, so the ticket is useful on its own.

## Technical notes

- Migration: add `message` and `client_subject` (nullable text) to `customer_tickets`; relax SELECT/UPDATE policies from `admin|agent` to any authenticated user, keep DELETE admin-only, keep service-role insert.
- `src/pages/TicketLoading.tsx` becomes a form page (zod-validated, message required, max ~2000 chars) that POSTs `orderId`, `email`, `message`, `subject` to `create-client-ticket`; success still routes to `/ticket-submitted`.
- `supabase/functions/create-client-ticket/index.ts`: validate and persist the message; after insert, look up `app_users` (fallback `profiles`) for a client-role account matching `client_email`, and set `assigned_client_id/name/email` when found; include the message and link status in the team email. Keep duplicate-window guard and fire-and-forget notifications.
- `supabase/functions/assign-customer-ticket/index.ts`: drop the `admin|agent` role gate, keep the JWT check.
- `src/pages/CustomerTicketDetail.tsx`: render message block, order context (fetch order by `order_id`), "no portal account" notice with a button invoking `request-client-credentials` with the ticket's `order_id`, then assign the resulting account.
- `src/services/customerTicketService.ts`: extend the `CustomerTicket` type; add helper to fetch the order context and to find a portal user by email.
- No change to email sender conventions (`RESEND_API_KEY_ABMEDIA`, abm-team.com sender, empriatech.com links).
