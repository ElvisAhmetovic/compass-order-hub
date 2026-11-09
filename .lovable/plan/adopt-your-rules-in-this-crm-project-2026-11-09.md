# Adopt your rules in this CRM project

## Honest status today
Only partly. This project uses a different setup than your website (React + Vite + Lovable Cloud here, vs Next.js + FastAPI + Vercel/Render there), so some rules never applied. Of the ones that do:
- Followed: database changes are saved as dated files (there are 160 of them); secrets are never printed; no packages installed without a reason; tests exist for AI Outreach rules and they're run after changes; I tell you what I couldn't check.
- Not followed consistently:
  - No Given/When/Then description before building (the AI sidebar change skipped it).
  - Linting the changed files, and listing which checks ran, wasn't done every time.
  - Live data was changed during QA, like the test outreach drafts and the reset of the test invoice. You'd asked for that work, but you didn't approve each change on its own.
  - Some new server code uses loose `any` types.

## What I'll add
A new rules file in the project, adapted to how this CRM works, plus a short pointer in the project's main rules so every future change follows it.

Adapted rules:
1. **Before building:** describe the expected behavior in Given/When/Then. For a new feature, wait for your OK first. Ask when anything is unclear.
2. **Tests:** write tests together with the code for business rules (invoices, reminders, outreach, permissions). Skip pointless tests for pure layout changes. Never weaken a failing test to make it pass.
3. **Permissions:** every new server function that touches client, order, invoice or admin data must check who is signed in. It gets a test showing that strangers are refused.
4. **Typing:** no new `any` in new or changed code.
5. **Checks after every change**, always reported with what ran and what was skipped and why:
   - Gate A (every change): lint the changed files, the build/typecheck, related tests, and calling the changed function or loading the page.
   - Gate B (bigger features, money, sign-in or database changes): the full test suite plus read-only checks against live data.
6. **Live data:** read-only by default. No inserting, editing or deleting real orders, invoices, clients or drafts without your OK for that specific run. Emails go only to internal addresses during tests.
7. **Database:** every change goes through dated forward migration files. Old ones are never edited.
8. **Scope:** don't touch unrelated files. Report other bugs instead of fixing them silently. No big architecture swaps without being asked.
9. **Old reports** (QA_REPORT*.md, HANDOFF.md) are leads, not facts. Re-check the current code before acting on them.
10. **Communication:** plain language, short explanations of technical terms, and nothing called "verified" unless it was actually checked.

Left out on purpose, because they don't fit this project: Next.js/FastAPI structure, Windows/PowerShell notes, the git branches/PR flow (Lovable manages versions here), Vercel/Render deploys (here you click Publish), and the locale/SEO gates.

## Technical details
- New `PROJECT_RULES.md` at the root with the adapted rules and gate commands (`bunx eslint <files>`, `bunx vitest run <files>`, build log).
- One short line in `AGENTS.md` pointing to it.
