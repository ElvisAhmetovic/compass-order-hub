# Adopt the team's quality rules in this project

The project already follows most of these rules (Given/When/Then first, tests with business rules, 401/403 checks, no new `any`, forward migrations, read-only live data, old reports are leads). This plan adds the parts that are missing and adapts them to this app, without taking over the other project's stack or names.

## What gets added to PROJECT_RULES.md
1. **Coverage:** new or changed business logic must reach at least 80% line and branch coverage, measured on the changed files only. Old untouched code is never a blocker.
2. **Mutation testing:** required for changed logic involving permissions, money, invoices/reminders, Stripe, status changes, retries or complex branching. Not needed for layout, constants or plain wrappers. Every skipped file is named with its reason. Normal changes get at most 30 minutes, and a finished target must score at least 70%. Equivalent survivors may be documented with specific reasons. The temporary sandbox is cleaned up after each run.
3. **Gate C (release / big change):** full test suite, full main journeys, permission and client-isolation regression checks, production build, full coverage report and wider mutation runs. It runs for auth, roles/RLS, migrations, Stripe or shared-code changes, and before big releases.
4. **Main journeys split:** *Smoke* (login, team vs. non-team access, client portal isolation, order create/edit, invoice create/send, monthly packages, logout) runs at Gate B. *Full* (all lists, filters, error states, settings) runs at Gate C.
5. **Executable behavior specs:** every new user-facing behavior gets its Given/When/Then written as named test cases (Vitest `describe`/`it` named after the scenario), not as loose text files.
6. **Git hygiene:** stage named files only, never `git add -A` / `git add .`. Check status and diff first, and confirm that no `.env`, secrets or temporary files are staged before each commit. (Branches, PRs and pushes are handled by the platform here, so that section is adapted rather than copied.)
7. **Stronger evidence rule:** before acting on a report, record what it checked, prove the problem still exists (file/line or live output), and search for later fixes and existing tests. When an old test fails, first decide whether a deliberate later change made it outdated.
8. **Typing:** no new `any` in TypeScript, including Edge Functions. Every exported function in shared server code gets typed parameters and return values.

## Tools installed (test-only, approved)
- `@vitest/coverage-v8`: coverage reports.
- `@stryker-mutator/core` + `@stryker-mutator/vitest-runner`: mutation testing.
- New commands: `test`, `test:coverage` (changed files), `test:mutate` (targets chosen per change). Config files: coverage settings in the Vitest config, and `stryker.conf.json` with sandbox output kept out of git.

## Checks after setup
- Run coverage once on the recent access-control code, and mutation once on `teamAccess.ts`, to prove both tools work. Report the scores honestly.
- Run the existing test suite to make sure nothing breaks.
- The AGENTS.md pointer to PROJECT_RULES.md stays as it is.

## Not taken over
Next.js/FastAPI structure, folder boundaries, pytest-bdd, PowerShell git commands, branch/PR steps, Redis/Kafka rules, and the other project's name.
