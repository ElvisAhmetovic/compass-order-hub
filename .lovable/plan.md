# Full security QA pass

## What the quick check already found (12 issues)
Access rules on these tables only check "is signed in" or allow everything, so any logged-in account (including client portal accounts or old self-registered accounts) could read or add records:
- Read everything: achievement_definitions, sidebar_config, social_media_best_times, team_challenges, upsells, reactions, payment_reminder_logs
- Add anything: companies, proposals, upsell_categories, upsell_translations
- Anyone (even signed out) can add: customer_tickets

A deeper code review (logins, permissions, data leaks, secrets) is running now and will add its findings to this plan.

## Steps
1. **Lock the tables above** to team only (admin/agent) using the same rule as the rest of the CRM. Keep only what clients genuinely need (e.g. their own tickets/proposals) and keep the public contact/ticket form working, but with field checks.
2. **Role-by-role access tests** (automated, against test accounts only, read-only on real data):
   - Signed out, client portal account, "user" (no access) account, agent, admin.
   - For every table: who can read, add, change, delete. Expected matrix written first, then tested.
3. **Server functions check**: every function is called without login, with a client login and with a wrong key; must answer 401/403 where expected (payments, AI assistant, create-user, reminders, Stripe webhook signature).
4. **Client portal isolation**: test client must see only its own orders, invoices, payment links and files; trying another client's ID must fail.
5. **App checks**: CRM pages, AI, Team Chat blocked for non-team; finance totals only for allowed emails; no secrets in the website code; file storage buckets not public unless intended.
6. **Dependency check** for known vulnerable packages and update where safe.
7. **Fix the deep-scan findings**, then rerun both scans until clean; full test suite + main journeys (login, order, invoice, portal payment) must pass.
8. Short report in plain language: what was found, what was fixed, what remains (e.g. turning off sign-ups in Supabase, renewing the Stripe webhook secret).

## Technical notes
- Forward-only migration replacing `auth.uid() IS NOT NULL` / `true` policies with `is_team()`; customer_tickets insert gets a `WITH CHECK` on required fields/length.
- RLS tests via supabase-js with per-role test sessions; Deno tests for edge function 401/403; added to the repo per PROJECT_RULES.md.
