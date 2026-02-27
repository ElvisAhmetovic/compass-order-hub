

## Add "Payment Reminders Sent" Tab to Order Modal

### Overview
Add a new tab in the order detail modal that shows all payment reminder emails sent for that order, with details about date, message content, template used, and invoice attached.

### Database Change
Add columns to `client_email_logs` to capture template and invoice info that's currently not stored:
- `email_subject TEXT` — the subject line used
- `template_name TEXT` — which template was used
- `invoice_number TEXT` — which invoice was attached (if any)

### Edge Function Update: `send-client-payment-reminder/index.ts`
Update the insert into `client_email_logs` to include the three new fields (`email_subject`, `template_name`, `invoice_number`).

### New Component: `src/components/orders/PaymentRemindersSentTab.tsx`
- Fetch from `client_email_logs` filtered by `order_id`, ordered by `created_at` desc
- Real-time subscription for new inserts
- Each entry shows:
  - Date/time sent (formatted) + relative time
  - Sent by (name)
  - Sent to (email)
  - Amount due
  - Email subject line
  - Template name used
  - Invoice number attached (if any), shown with 📎 icon
  - Custom message (expandable/collapsible if present)
- Empty state when no reminders sent

### Update: `src/components/dashboard/OrderModal.tsx`
- Import and add a new tab "Payment Reminders" with a `Bell` icon after "Email History"
- Render `PaymentRemindersSentTab` with `orderId` prop

### Files Changed

| File | Change |
|------|--------|
| Migration | Add `email_subject`, `template_name`, `invoice_number` columns to `client_email_logs` |
| `supabase/functions/send-client-payment-reminder/index.ts` | Log new fields on insert |
| `src/components/orders/PaymentRemindersSentTab.tsx` | New component — list of sent reminders |
| `src/components/dashboard/OrderModal.tsx` | Add "Payment Reminders" tab |

