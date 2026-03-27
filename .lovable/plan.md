

## Add "Confirm Payment Received" Button to Invoices

### What
A green checkmark button on each invoice row that, when clicked:
1. Sets the invoice status to **paid** (reusing existing `handleUpdateStatus` which already syncs to orders, monthly installments, and clears reminders)
2. Sends a "Payment Received" confirmation email to the **client**
3. Sends a team copy to the notification list (excluding johan@team-abmedia.com per existing rule)
4. Shows a success toast

### Safety Analysis

**What could break?**
- **Nothing in the status sync path** — we reuse the existing `handleUpdateStatus('paid')` which already: clears `next_reminder_at`, syncs to linked orders (toggles Invoice Paid), syncs to linked monthly installments, and updates local state.
- **Email is fire-and-forget** — if the edge function fails, the status change still succeeds. No blocking.
- **Button only shows for actionable statuses** — hidden when already paid/cancelled/refunded, preventing duplicate sends.
- **RLS on invoice update** — `handleUpdateStatus` uses `InvoiceService.updateInvoice` which goes through RLS. For invoices the user doesn't own, this could fail. However, the existing status dropdown already has this same behavior, so this button is no worse than what exists. For cross-user syncs, the order sync path already uses `sync_invoice_status_by_order` RPC.

### Implementation

**1. New Edge Function: `supabase/functions/send-payment-confirmation/index.ts`**
- Accepts: `invoice_number`, `client_name`, `client_email`, `amount`, `currency`
- Validates JWT + input (email regex, required fields)
- Sends client email: professional "Payment Received — Thank You" HTML email from `noreply@abm-team.com` using `RESEND_API_KEY_ABMEDIA`
- Sends team copy to notification list (without johan@team-abmedia.com)
- Batched sending: 2 per batch, 1s delay (existing pattern)
- European amount formatting (de-DE locale)

**2. Update `src/pages/Invoices.tsx`**
- Add a green `CheckCircle2` button in the Actions column (before the View button)
- Only visible when `invoice.status !== 'paid' && invoice.status !== 'cancelled' && invoice.status !== 'refunded'`
- On click: calls existing `handleUpdateStatus(invoice.id, 'paid')`, then fire-and-forget invokes `send-payment-confirmation`
- Toast: "Payment confirmed & notification sent"

**3. Update `supabase/config.toml`**
- Add `[functions.send-payment-confirmation]` with `verify_jwt = true`

### Files to create/modify
1. `supabase/functions/send-payment-confirmation/index.ts` — New edge function
2. `src/pages/Invoices.tsx` — Add confirm payment button in Actions column
3. `supabase/config.toml` — Register new function

