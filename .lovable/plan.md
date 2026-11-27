# Client profile page

## Today
- Clients page lists clients (name, email, phone, address) with edit/delete dialogs; there is no page for a single client and no notes field.
- Replies and Customer Tickets only show the email (plus business name where found); nothing links to the client.

## Change
- **New client profile page** (Clients → click a client), team only:
  - Header: business name, contact person, email (click to email), phone (click to call), address.
  - **Notes**: a free-text team note, editable and saved on the page ("Last edited by … on …").
  - Lists of this client's orders, support tickets and outreach replies (newest first), each linking to its detail.
- **Clients list**: the name becomes a link to the profile.
- **Replies tab**: each reply shows the matched client's business name, contact person and phone, with a "View client" link. Unmatched senders show "Not a known client" plus a **"Create client"** button pre-filled with their email, name and business.
- **Customer Tickets**: same — the client column shows real name and phone from the profile and links to it.
- Matching is by email address (case-insensitive), so it works for existing replies and tickets with no data changes.

## Technical details
- Migration: add `notes text`, `notes_updated_at timestamptz`, `notes_updated_by uuid` to `clients`; existing team-only RLS unchanged. Index on `lower(email)`.
- New route `/clients/:id` → `src/pages/ClientProfile.tsx` behind `RequireAuth` + `isTeamRole`; loads client, orders (`contact_email` match), `customer_tickets` (`client_email` / `assigned_client_id`), `outreach_replies` (`from_email`); load errors show a retry card.
- Shared hook `useClientsByEmail(emails[])` (one query, `ilike any`) used by Replies and Customer Tickets.
- `CreateClientDialog` accepts optional prefill values.
- Pure helper `matchClientByEmail(clients, email)` with unit tests (case/whitespace, no match).
- Layout follows admin wrapper (`flex min-h-screen` > `flex-1 flex flex-col`), back button navigates to `/clients`.
