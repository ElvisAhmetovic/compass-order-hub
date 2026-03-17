

## Automatic Invoice Payment Reminder System

### What This Does
When an invoice linked to an order remains unpaid (status is "sent" or "overdue") for 2 days, the system automatically sends a branded payment reminder email to the client and the team. If still unpaid after another 2 days, another reminder is sent, and so on until the invoice status changes to "paid". Each invoice tracks how many reminders were sent, viewable via a button on the Invoices page.

### Database Changes

**New table: `invoice_payment_reminders`**
- `id` (uuid, PK)
- `invoice_id` (uuid, FK → invoices)
- `order_id` (uuid, FK → orders)
- `reminder_number` (integer) — which reminder this is (1st, 2nd, 3rd...)
- `sent_at` (timestamptz)
- `sent_to_client` (text) — client email
- `sent_to_team` (boolean)
- `created_at` (timestamptz)

**New column on `invoices` table:**
- `reminder_count` (integer, default 0) — quick count of reminders sent
- `last_reminder_sent_at` (timestamptz, nullable) — when the last reminder was sent
- `next_reminder_at` (timestamptz, nullable) — when the next reminder should fire

### Edge Function: `send-invoice-payment-reminders`
A cron-triggered function (every 15 minutes) that:
1. Queries invoices where `status` IN ('sent', 'overdue') AND `next_reminder_at <= now()`
2. For each due invoice, finds the linked order (via `notes` containing "Order ID: {id}")
3. Fetches order details (company name, contact email, phone, address, description)
4. Sends a branded email (AB Media Team style, matching the order confirmation template) to:
   - The client's `contact_email` from the order
   - All 12 team members
5. Updates `reminder_count`, `last_reminder_sent_at`, and sets `next_reminder_at` to +2 days
6. Logs the reminder in `invoice_payment_reminders`

The email template will match the order confirmation style with:
- AB Media Team header with branding
- Client name, email, phone, address
- Order description (e.g., "5 Google Local Guide Bewertungen")
- Invoice number and amount due (European format)
- Reminder number ("This is reminder #3")

### Setting `next_reminder_at`
When invoice status is set to "sent" (either via invoice creation from order or manual status change), `next_reminder_at` is set to `now() + 2 days`. This is done in `OrderService.toggleOrderStatus()` (which already syncs invoice status) and in the Invoices page status dropdown handler.

When status changes to "paid", `next_reminder_at` is set to NULL (stops reminders).

### UI: Reminder History Button on Invoices Page
Add a small bell/mail icon button in the Actions column of each invoice row. Clicking it opens a dialog showing:
- Total reminders sent
- List of each reminder with: date, reminder #, client email sent to
- Current status (next reminder scheduled for X, or "No more reminders — invoice paid")

### Files to Create/Modify

| File | Action |
|------|--------|
| Migration SQL | Create `invoice_payment_reminders` table + add columns to `invoices` |
| `supabase/functions/send-invoice-payment-reminders/index.ts` | New cron edge function |
| `supabase/config.toml` | Add function config |
| `src/services/orderService.ts` | Set `next_reminder_at` when syncing invoice status |
| `src/pages/Invoices.tsx` | Add reminder count badge + history button per invoice |
| `src/components/invoices/InvoiceReminderHistory.tsx` | New dialog component |
| `src/services/invoiceService.ts` | Add methods for reminder history + updating reminder fields |

### Cron Setup
The edge function will be called via `pg_cron` every 15 minutes, similar to the existing `send-order-payment-reminders` setup. Uses `RESEND_API_KEY_ABMEDIA` for sending from `noreply@abm-team.com`.

