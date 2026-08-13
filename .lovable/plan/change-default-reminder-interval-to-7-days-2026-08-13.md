# Change Default Reminder Interval to 7 Days

## Goal

Set the default automated payment reminder interval to **7 days (168 hours)** for all new invoices. Existing invoices that already have a custom interval keep it; legacy invoices that never had a value set will now inherit the 7-day default instead of the current 2-day default.

## Current State (confirmed by code reads)

- `public.invoices.reminder_interval_hours` defaults to `48`.
- `InvoiceReminderHistory.tsx` initializes the interval UI to `48` hours and falls back to `48` when loading an invoice.
- `SendInvoiceDialog.tsx` uses `currentInvoice?.reminder_interval_hours || 48` when scheduling the first reminder.
- `send-invoice-payment-reminders` edge function uses `invoice.reminder_interval_hours || 48` when computing the next reminder after sending.

## Changes

### 1. Database migration

- Alter `public.invoices.reminder_interval_hours` default value from `48` to `168`.
- Update existing rows where the column is `NULL` (or exactly `48` only if it was never explicitly customized) to `168` so the new default applies consistently.
- No new RLS needed; column keeps existing invoice policies.

### 2. Frontend: `InvoiceReminderHistory.tsx`

- Change default `intervalHours` state from `48` to `168`.
- Change `intervalValue` initial state from `"48"` to `"7"` and default unit to `"days"`.
- Update `loadInterval` fallback from `48` to `168`.
- Keep the hours/days toggle and the 1h–30d validation range unchanged.

### 3. Frontend: `SendInvoiceDialog.tsx`

- Change fallback from `48` to `168` when `reminder_interval_hours` is not set.
- This ensures the first scheduled reminder on a new invoice is 7 days out by default.

### 4. Edge function: `send-invoice-payment-reminders/index.ts`

- Change fallback from `48` to `168` when computing `nextReminderAt` after a reminder is sent.
- Re-deploy the function.

## What does NOT change

- Manual per-invoice overrides remain fully editable.
- The validation range (1 hour to 30 days) stays the same.
- The cron schedule (every 1 minute) stays the same.
- Reminder escalation logic and pause rules are unchanged.  
  
  
Project Constraints — Non-Negotiable
  ## Before writing any implementation code
  1. State your understanding of the requirement in Gherkin format
    (Given/When/Then). Wait for explicit approval before proceeding
    if this is a new feature (not a bugfix).
  2. If the requirement is ambiguous or underspecified, stop and ask.
    Do not guess and proceed.
  ## While implementing
  - Write the test first, or immediately alongside the code — never
    implementation-then-tests-as-an-afterthought.
  - Every new function/endpoint requires:
    - Unit tests covering the happy path AND at least 2 edge/failure cases
    - Type coverage: no any in TypeScript, no untyped function
      signatures in Python
  - Every new user-facing behavior requires a corresponding Gherkin
    scenario in /tests/features/
  ## Before declaring a task complete
  Run and report the results of, in this order — stop and fix if any fail,
  do not proceed to the next gate with a failing one:
  1. Linter (eslint / ruff)
  2. Type checker (tsc --noEmit / mypy)
  3. Unit test suite — must pass 100%
  4. Test coverage — report %, flag if any new file is under 80%
  5. Mutation testing on changed files only (not full suite — too slow)
    — report mutation score, flag if under 70%
  ## Hard rules
  asking first, even if you notice an unrelated bug — report it instead.
  the Gherkin scenarios covered, and the test/coverage/mutation results.
  - If a test you wrote is failing, do not weaken the test to make it
    pass — fix the implementation, or flag that the requirement itself
    may be wrong.
  - Report uncertainty explicitly. "I implemented X but I'm not fully
    confident about Y edge case" is required output, not optional.  
    integration tests — specifically, RLS policy tests.