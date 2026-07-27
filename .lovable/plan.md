# Turn B — P1 Correctness Fixes

Low-risk reliability improvements. No changes to UI layout or business rules — just tightens error handling and data consistency around invoice edits and sends.

## What changes

### 1. Atomic invoice header + line items save
**Problem:** `updateLineItem` writes each row separately from the header `handleSave`. If one call fails, totals and Bill-To can drift out of sync.

**Fix:** New Postgres RPC `update_invoice_with_lines(p_invoice_id uuid, p_header jsonb, p_lines jsonb)` that runs everything in a single transaction and lets the existing `recalculate_invoice_totals` trigger fire once at the end. `InvoiceDetail.tsx` calls the RPC instead of separate updates.

### 2. Friendly error when invoice already exists for an order
**Problem:** Double-clicking "Invoice Paid" or two admins acting near-simultaneously both pass the "no active invoice" check, and the unique index rejects the second insert with a generic error.

**Fix:** In `OrderService.toggleOrderStatus` (and `InvoiceService.createInvoice`), catch Postgres error code `23505` on invoice insert and surface a clear toast: "An invoice already exists for this order." No duplicate is created; existing invoice is reused.

### 3. Log review-request trigger failures
**Problem:** The `orders_review_request_trigger` swallows all exceptions silently. If Resend or the edge function is down, nothing tells us.

**Fix:** On exception, insert a row into `client_email_logs` with `type='review_request_error'` and the error message. Non-blocking; order updates still succeed.

### 4. Send-invoice dialog uses Bill-To email when set
**Problem:** `SendInvoicePDFDialog` prefills recipient from `client.email`. If Bill-To was overridden on the invoice, the cover email still goes to the old client email.

**Fix:** Prefer `invoice.bill_to_email` over `client.email` when populating the "Client Email" field. Falls back to `client.email` when no override exists.

## Files touched

- `supabase/migrations/*` — new RPC `update_invoice_with_lines`; no schema changes
- `src/pages/InvoiceDetail.tsx` — call RPC on save
- `src/services/orderService.ts` — 23505 handling
- `src/services/invoiceService.ts` — 23505 handling
- `supabase/migrations/*` — update `trigger_review_request_on_order_update()` to log failures
- `src/components/invoices/SendInvoicePDFDialog.tsx` — prefer bill_to_email

## Out of scope

- No UI redesign
- No changes to invoice numbering, PDF layout, or email templates
- Turn C (work-hours undo, delete confirmations, brand sweep) stays for a follow-up

## Safety

All changes are additive or wrap existing logic with error handling. The RPC is a new function — existing save paths remain until we swap the call. No RLS or grant changes.
