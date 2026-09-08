# Turn off automatic reminder emails per client

Some clients (for example yearly-package customers) should never receive automatic payment reminder emails, while everyone else keeps them. This adds a simple on/off switch on each client.

## What you get

- A new switch on every client: **Send automatic payment reminders** (on by default, so nothing changes for existing clients).
- The switch appears in the client edit window and as a small "Reminders off" label in the client list, so you can see at a glance who is excluded.
- When the switch is off, the system stops sending that client the scheduled reminder emails — for all their invoices, yearly and otherwise.
- Your team still receives its internal reminder notifications as before.
- Staff can still send a reminder manually from an order or invoice at any time; the switch only controls the automatic ones.

## How it works

1. Add a column `auto_reminders_enabled` (boolean, default `true`, not null) to `public.clients`. Existing rows are backfilled to `true`.
2. Update the `send-invoice-payment-reminders` edge function: before sending the client email, resolve the client for the invoice —
   - use `invoice.client` (already loaded through `client:clients(*)`), and
   - if the invoice has no client record, fall back to a lookup in `clients` by the order's `contact_email`.

   If the resolved client has `auto_reminders_enabled = false`, skip the client email, log the skip, and clear `next_reminder_at` so the invoice stops re-queueing. The invoice's own `reminders_paused` and interval logic stay untouched.
3. Frontend:
   - `src/components/clients/EditClientDialog.tsx` and `CreateClientDialog.tsx`: add a Switch bound to `auto_reminders_enabled`.
   - `src/services/invoiceService.ts` client create/update payloads: pass the new field through.
   - `src/pages/Clients.tsx`: show a muted "Reminders off" badge for clients with the switch disabled.
4. Manual reminder paths (`SendClientReminderModal`, `SendInvoiceDialog`, `send-client-payment-reminder`) are left unchanged.

## Note

Reminders are matched to a client record. If a yearly order was created without a linked client, the fallback email match handles it; if the order has no contact email either, there is nothing to suppress because no client email is sent anyway.
