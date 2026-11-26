# Lock down self-registered accounts and stop public sign-up

## What is wrong today
- People who sign up with the Register button get the role "user". 10 accounts like this exist right now.
- The side menu shows the AI group (AI Outreach) to everyone, and Team Chat, Support and Reviews are also open to "user".
- Behind the screens, Team Chat messages and AI outreach drafts are readable by anyone who is not a client, so a "user" can read them even without the menu.
- The Register button is on the public website header, mobile menu, footer and the login page.

## What will change
1. **Team areas are team-only.** Only admins (and agents) see and can open: AI group (Assistant, AI Outreach), Team Chat, and every other CRM page. A "user" account sees only a simple "Your account is waiting for access from the Empria team" page after login.
2. **Data is locked too, not just hidden.** Team Chat (channels, messages, reactions), AI outreach drafts/skips and other team-only data become readable only by admins/agents.
3. **No more public sign-up.** Register links are removed from the website header, mobile menu, footer and login page. The /register address sends people to the login page. Sign-up is also switched off on the server so it cannot be bypassed.
4. **Admins create team accounts.** User Management > Add User stays the only way. After creating, the admin can send the person a professional Empria email with their login link (www.empriatech.com/login, not the client portal), email and temporary password, with a prompt to change it.
5. **Client portal unchanged.** Client accounts are still created automatically from orders/packages/offers as today.

## Existing 10 "user" accounts
They keep their login but lose all access (see waiting page). An admin can promote anyone real to admin/agent in User Management.

## Technical details
- Sidebar: `isTeam = role in [admin, agent]`; AI group, Team Chat, Support, Reviews, Work Hours Admin, Invoice Audit gated by it; "My Orders" for user removed.
- Route guard: a `TeamRoute` wrapper around all CRM routes; non-team non-client goes to `/no-access`.
- Migration: replace `NOT is_client()` policies on channels, messages, reactions, outreach_drafts, outreach_skips (and audit of other `NOT is_client()` policies) with `has_role(auth.uid(),'admin') OR has_role(auth.uid(),'agent')` via a new `is_team()` security-definer function.
- Server sign-up: disable public signups in Supabase Auth settings (dashboard toggle, since this is an external Supabase project; I will give the exact link). `create-user` uses the admin API so it keeps working.
- `create-user`: optional `send_login_email` flag; email sent from `Media Marketing <noreply@mediaamarketing.com>` with key `RESEND_API_KEY_ABMEDIA`, fire-and-forget. Admin check (401/403) kept with tests.
- Tests: sidebar hides AI/Team Chat for "user"; route guard redirects; create-user 401/403.
