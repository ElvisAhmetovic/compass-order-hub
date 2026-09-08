# Fix Sparsmart24 client portal access

## What I found

The portal itself is not broken — other clients are signing in normally. This account specifically was never usable:

- An account for `info@sparsmart24.de` exists (created 26 May 2026, email confirmed, not banned) and all 7 Sparsmart24 orders are correctly linked to it.
- **It has never been signed into once** — the last-sign-in record is empty since the day it was created.
- There is **no record of login credentials ever being sent** to this address. Every other client portal we opened has a "credentials sent" entry in the audit trail; Sparsmart24 has none.
- The account is also **missing its portal role entry** in the roles table (it only carries the role on the profile record) and has no entry in the internal user list, so it doesn't appear in the client dropdown for staff.

So: the account was created automatically when their orders were linked, but nobody ever sent them a password, and the account was never fully set up.

## What to do

1. Send Sparsmart24 fresh portal credentials (new generated password) to `info@sparsmart24.de` using the existing credential-sending flow, so they get a working email and password.
2. Add the missing portal role entry for this account so their access is recorded consistently, and add the missing internal user-list entry so staff see them in the client dropdown.
3. Check for other clients in the same broken state — accounts flagged as portal clients that have never signed in and never received credentials — and list them so you can decide who else needs credentials sent.
4. Prevent a repeat: when an order gets linked to a client account, make sure the flow either sends credentials or clearly flags the account as "no credentials sent yet" in the admin view.

## Verification

- Confirm the credential email is dispatched and the audit trail records it.
- Confirm the role and user-list entries exist for the account.
- Confirm the account can reach the client portal (sign-in check against the portal login).

## Technical notes

- Account ID `5c7b3851-541b-4ad0-a256-8276acbf2088`; `auth.users.last_sign_in_at` is NULL, `email_confirmed_at` set, `banned_until` NULL.
- Missing rows: `public.user_roles` (role `client`) and `public.app_users`. `profiles.role = 'client'` is present, and `AuthContext` falls back to it, so login would have worked had a password been set.
- Credential delivery: reuse the `request-client-credentials` / `send-client-portal-credentials` edge functions (generates a 14-char password, updates the auth user, logs to `order_audit_logs`). Note `request-client-credentials` has a 5-minute per-order throttle.
- Step 3 query: portal-role profiles joined against `auth.users.last_sign_in_at IS NULL` with no `client_portal_credentials_*` audit entry.
