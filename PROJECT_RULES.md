# Project Rules & Quality Gates — Media Marketing CRM

Adapted from the team's website rules for this project (React + Vite + TypeScript, Lovable Cloud backend with Edge Functions). Applies to people and AI agents.

## 1. Before building
- Describe the expected behavior in Given / When / Then.
- New feature: wait for explicit user approval before writing code. Bugfix/content change: proceed after stating it.
- If anything is ambiguous, ask. Never assume.

## 2. Tests
- Write tests together with the code for business rules: invoices, reminders, payments, outreach, permissions.
- Cover the main path, each changed decision branch, boundaries, failure states, and authorization. Every bug fix gets a regression test.
- No artificial tests for pure layout, constants or pass-through code.
- Never weaken, skip or delete a failing assertion to force a pass. First check whether a deliberate later change made it obsolete, and name that change.
- Tests never read or write live data. Use fakes.

## 3. Permissions
- Every new or changed Edge Function touching client, order, invoice, payment or admin data must verify the caller (JWT/team check), with a test or recorded check that unauthenticated calls get 401 (and non-team 403 where relevant).

## 4. Typing
- No new `any` in new or changed code. Don't rewrite unrelated existing ones without approval.

## 5. Verification gates (always report what ran, what was N/A and why)
- **Gate A — every change:** `bunx eslint <changed files>` (no new errors on changed lines), build/typecheck clean in the build log, related tests via `bunx vitest run <files>`, and exercise the touched boundary (call the function / load the page).
- **Gate B — larger features, money, auth or database changes:** full `bunx vitest run`, read-only checks against live data, and the affected main journeys (login, dashboard orders, invoice create/send, monthly packages, AI Outreach).
- Stop and fix failures before continuing.

## 6. Hard rules
- **Live data is read-only by default.** No insert/update/delete of real orders, invoices, clients, drafts or settings without the user's OK for that specific run. Test emails go to internal addresses only.
- **Forward migrations only:** every schema/RLS/function change ships as a new dated file in `supabase/migrations/`. Never edit an applied migration.
- **Scope:** don't modify files outside the task. Report unrelated bugs instead of silently fixing them.
- **Secrets:** never print, log or commit keys, tokens or passwords.
- **Dependencies:** no new packages without a stated reason and user authorization.
- **No unassigned architecture changes:** don't swap stack, auth, routing or data access without being asked.
- **Old reports are leads, not facts:** `QA_REPORT*.md`, `HANDOFF.md`, comments and past analyses must be re-checked against current code/data before acting, and already-fixed work is not redone.
- **Uncertainty:** state residual risks. Nothing is called "verified" unless checked against code, live app or database.

## 7. Communication
- Technically exact, but plain language. Explain jargon briefly in parentheses.
- When citing an earlier approval, say where it was given.
- Releases: changes reach colleagues only after Publish. Say when publishing is needed.
