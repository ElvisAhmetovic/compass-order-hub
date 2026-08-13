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
