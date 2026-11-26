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

- **Executable behavior specs:** every new user-facing behavior gets its Given/When/Then as named test cases (Vitest `describe`/`it`, or `Deno.test` for Edge Functions, named after the scenario). Loose text specs don't count as coverage.

### Coverage (`bun run test:coverage`)
- New or materially changed business logic: at least 80% line and branch coverage, measured on the changed files (`--coverage.include=<file>`), unless a technical reason is documented.
- Never require untouched legacy code to meet the threshold for an unrelated change. Full-repo coverage belongs to Gate C.

### Mutation testing (`bun run test:mutate`, targets set in `stryker.conf.json` → `mutate`)
- Required for materially changed logic in: permissions/roles/RLS mirrors, money and currency, invoices and reminders, Stripe, status/lifecycle changes, persistence writes, retries, concurrency, or complex branching.
- N/A (state the reason for each file, never skip silently): types, constants, config, display-only components, generated code, pass-through wrappers, logging-only changes.
- Mutate only the changed modules and run only the tests that cover them. Normal changes get at most 30 minutes. Report the score, survivors and pass/fail for each file, and list unfinished files as deferred, never as passed.
- A finished target below 70% fails: fix it, or have the reviewer explicitly accept the risk. Genuinely equivalent survivors may be documented with specific, checkable reasoning.
- Clean the `.stryker-tmp/` sandbox after each run. Exhaustive mutation runs belong to Gate C or scheduled runs.

## 3. Permissions
- Every new or changed Edge Function touching client, order, invoice, payment or admin data must verify the caller (JWT/team check), with a test or recorded check that unauthenticated calls get 401 (and non-team 403 where relevant).

## 4. Typing
- No new `any` in new or changed code, including Edge Functions. Don't rewrite unrelated existing ones without approval.
- Exported functions in shared server code (`supabase/functions/_shared/`) have typed parameters and return values.

## 5. Verification gates (always report what ran, what was N/A and why)
- **Gate A — every change:** `bunx eslint <changed files>` (no new errors on changed lines), build/typecheck clean in the build log, related tests via `bunx vitest run <files>`, and exercise the touched boundary (call the function / load the page).
- **Gate B — larger features, money, auth or database changes:** full `bun run test`, coverage and mutation on the changed in-scope files (see section 2), read-only checks against live data, and the **smoke journeys**.
- **Gate C — releases and big changes** (auth, roles/RLS, migrations, Stripe, shared code, or a major release): full test suite, full Edge Function tests, the **full journeys**, permission and client-isolation regression checks, production build, full coverage report, and wider mutation runs on critical business and security logic. It may also run on a schedule.
- **Smoke journeys:** login, team vs. non-team access, client portal isolation, order create/edit, invoice create/send, monthly packages, logout.
- **Full journeys:** smoke plus all lists, filters, sorting, error states, settings, reminders, AI Outreach and the Assistant.
- Stop and fix failures before continuing.

## 6. Hard rules
- **Live data is read-only by default.** No insert/update/delete of real orders, invoices, clients, drafts or settings without the user's OK for that specific run. Test emails go to internal addresses only.
- **Forward migrations only:** every schema/RLS/function change ships as a new dated file in `supabase/migrations/`. Never edit an applied migration.
- **Scope:** don't modify files outside the task. Report unrelated bugs instead of silently fixing them.
- **Secrets:** never print, log or commit keys, tokens or passwords.
- **Dependencies:** no new packages without a stated reason and user authorization.
- **No unassigned architecture changes:** don't swap stack, auth, routing or data access without being asked.
- **Old reports are leads, not facts:** `QA_REPORT*.md`, `HANDOFF.md`, monitoring findings, comments and past analyses are evidence to investigate. Before acting: note what and when the report checked, prove the problem still exists (file/line or live output), search for later fixes and existing tests, and don't redo work that's already fixed.
- **A failing old test isn't proof the code is wrong:** first check whether a deliberate later change made the assertion outdated. If it did, update the assertion and name that change. Never adjust an assertion that is catching a real defect.
- **Git hygiene:** stage named files only, never `git add -A` or `git add .`. Check `git status` and `git diff` first, and confirm that no `.env`, secret, temporary or report file (`coverage/`, `.stryker-tmp/`, `reports/`) is staged before each commit. Branches, pushes and PRs are handled by the platform.
- **Uncertainty:** state residual risks. Nothing is called "verified" unless checked against code, live app or database.

## 7. Communication
- Technically exact, but plain language. Explain jargon briefly in parentheses.
- When citing an earlier approval, say where it was given.
- Releases: changes reach colleagues only after Publish. Say when publishing is needed.
