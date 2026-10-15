# Cancelled invoices: red X button with cancellation date

On the Invoices list, the green "Confirm Payment Received" button disappears today when an invoice is cancelled. Instead, cancelled invoices will show a red **X** button in the same spot.

## What the team will see

- **Red X button** on every cancelled invoice, in the place of the green tick. It updates by itself: when someone marks the order as **Cancelled**, the linked invoice is already cancelled automatically, and the X appears right away.
- **Clicking the X** opens a small window (read-only) that says:
  - "This invoice is cancelled / Diese Rechnung wurde storniert"
  - **Cancelled on:** date and time (e.g. 15.10.2026, 14:23)
  - **Cancelled by:** the person's name, when known
  - **Reason:** "Order was marked Cancelled" or "Cancelled manually on the invoice"
- **Tooltip** on the X: "Cancelled on 15.10.2026".
- If the order's Cancelled mark is removed and the invoice comes back, the X disappears and the green tick returns. The cancellation date is cleared.

## Older cancelled invoices

Invoices cancelled before this change have no saved date. Where possible, the date is filled in from the invoice history log; otherwise the window shows "Cancelled (date not recorded)".

## Technical details

- Migration: add `cancelled_at timestamptz` and `cancelled_by uuid` to `public.invoices`. A BEFORE UPDATE trigger sets `cancelled_at = now()`, `cancelled_by = auth.uid()` when status changes to `cancelled`, and clears both when it leaves `cancelled`. Works for both the order-cancel sync (`sync_invoice_status`) and manual status changes.
- Backfill `cancelled_at` from `invoice_audit_logs` / `updated_at` where reliably available; leave null otherwise.
- `src/pages/Invoices.tsx`: in the actions cell, render an `XCircle` destructive-token button with an AlertDialog for `status === 'cancelled'`; reason derived from `auto_cancelled_by_order`; name looked up from `profiles` once for the visible page (single batched query).
- Add `cancelled_at`, `cancelled_by` to the `Invoice` type.
