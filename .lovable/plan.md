# Customizable Payment Reminder Interval per Invoice

## Goal
Let admins set or edit the interval (in hours or days) between automated payment reminders on each invoice — both for existing invoices and new ones. Currently the 48-hour interval is hardcoded in three places.

## Current State (confirmed by code reads)
- `invoices` table has: `next_reminder_at`, `reminder_count`, `last_reminder_sent_at`, `reminders_paused`, `cc_emails` — but **no interval column**.
- The 48h interval is hardcoded in:
  - `supabase/functions/send-invoice-payment-reminders/index.ts` line 514 — `Date.now() + 48 * 60 * 60 * 1000`
  - `src/components/invoices/SendInvoiceDialog.tsx` line 125 — same 48h when first marking invoice as sent
- `InvoiceReminderHistory.tsx` already shows reminder status, next-reminder time, CC emails, and the reminder log — this is the natural home for the interval control.

## Changes

### 1. Database migration (supabase--migration)
- Add `reminder_interval_hours integer DEFAULT 48` to `public.invoices` (nullable, so legacy invoices fall back to 48).
- No new RLS needed — column inherits existing invoice policies.

### 2. Edge function: `send-invoice-payment-reminders/index.ts`
- Replace hardcoded `48 * 60 * 60 * 1000` with `COALESCE(invoice.reminder_interval_hours, 48) * 60 * 60 * 1000`.
- The invoice object already fetched at line 361 includes all columns, so `reminder_interval_hours` is available — just read it.
- Redeploy the function.

### 3. Frontend: `InvoiceReminderHistory.tsx`
- Add an editable "Reminder interval" control inside the existing reminder dialog (next to the "Next reminder" status row).
- UI: a number input + a unit toggle (Hours / Days). When Days is selected, store `value * 24` in the DB column.
- On change, persist via `supabase.from('invoices').update({ reminder_interval_hours }).eq('id', invoice.id)`.
- Show current interval value (convert back to days for display if divisible by 24, otherwise show hours).
- Only show/edit when the invoice is NOT paid (same gating as the rest of the dialog).

### 4. Frontend: `SendInvoiceDialog.tsx`
- When marking an invoice as "sent" and setting the initial `next_reminder_at`, read the invoice's `reminder_interval_hours` (or default 48) instead of the hardcoded 48.
- This means if an admin already set a custom interval on a draft invoice, sending it respects that interval.

### 5. TypeScript types
- Add `reminder_interval_hours?: number | null` to the `Invoice` type in `src/types/invoice.ts` so the UI can read it without `as any` casts.

## What does NOT change
- The cron schedule (every 1 minute) stays the same.
- The escalation logic (reminder #1/2/3+) stays the same.
- Manual one-off reminders (`send-client-payment-reminder`) are unaffected.
- Internal order-based team reminders (`send-order-payment-reminders`) are unaffected.
- Auto-pause logic (paid/cancelled/deleted/paused) is unaffected.
