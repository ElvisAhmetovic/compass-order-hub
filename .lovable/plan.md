

## QA Audit: Payment Reminder Termination Across All Systems

### Audit Scope
Traced every path where invoice/order status changes and verified `next_reminder_at` is properly cleared when payment is received.

### Systems Checked

```text
Dashboard (toggleOrderStatus)
  ├── Invoice Paid ON  → invoice.status='paid', next_reminder_at=null  ✅
  ├── Invoice Paid OFF → invoice.status='sent'|'draft', reminder set/cleared accordingly  ✅
  ├── Invoice Sent ON  → invoice.status='sent', next_reminder_at=+48h  ✅
  ├── Invoice Sent OFF → invoice.status='paid'|'draft', reminder handled  ✅
  ├── Cancelled ON     → next_reminder_at=null on all linked invoices  ✅
  └── Soft Delete       → next_reminder_at=null on all linked invoices  ✅

Invoices page (handleUpdateStatus)
  ├── paid/cancelled/refunded/draft/partially_paid → next_reminder_at=null  ✅
  ├── sent/overdue → next_reminder_at=+48h (only if not already set)  ✅
  ├── Reverse sync to order (paid→Invoice Paid, sent→Invoice Sent)  ✅
  └── Reverse sync to monthly installment (paid/sent/draft)  ✅

Monthly Packages
  ├── Toggle Paid ON   → invoice.status='paid', next_reminder_at=null  ✅
  ├── Toggle Paid OFF  → invoice.status='sent', next_reminder_at=+48h  ✅
  ├── Toggle Email Sent ON  → invoice.status='sent', next_reminder_at=+48h  ✅
  ├── Toggle Email Sent OFF → invoice.status='draft', next_reminder_at=null  ✅
  └── Send Monthly Invoice  → invoice.status='sent', next_reminder_at=+48h  ✅

Edge Function (send-invoice-payment-reminders)
  ├── Only fetches status IN ('sent','overdue') + next_reminder_at <= now  ✅
  ├── Re-verifies fresh status before sending  ✅
  ├── Checks reminders_paused (twice: initial + fresh)  ✅
  ├── Skips deleted/cancelled orders + clears next_reminder_at  ✅
  └── Handles null order_id (monthly invoices)  ✅

Manual Pause Toggle (Invoices page)
  └── Sets/clears reminders_paused, edge function respects it  ✅
```

### Issue Found

**Edge function does NOT check `status_invoice_paid` on the order**

The edge function checks `status_deleted` and `status_cancelled` on the linked order, but does **not** check `status_invoice_paid`. This matters in a race condition scenario:

1. Admin toggles "Invoice Paid" on dashboard
2. `orderService.ts` updates the order (`status_invoice_paid = true`) and the invoice (`status = 'paid', next_reminder_at = null`)
3. But if the invoice update fails silently (RLS, network issue), the invoice remains `status = 'sent'` with a valid `next_reminder_at`
4. The edge function picks it up, re-verifies invoice status (still `sent`), and sends a reminder — even though the order says "paid"

This is the **only remaining gap**. The fix is to add an `status_invoice_paid` check in the edge function alongside the existing `status_deleted`/`status_cancelled` check.

### Fix

**`supabase/functions/send-invoice-payment-reminders/index.ts`** — After the deleted/cancelled check (line ~454), add:

```typescript
// Also skip if order is already marked as paid
if (orderData.status_invoice_paid) {
  console.log(`Skipping invoice ${invoice.invoice_number} - order is marked as invoice paid`);
  await supabase.from("invoices").update({ status: 'paid', next_reminder_at: null }).eq("id", invoice.id);
  continue;
}
```

This serves as a self-healing mechanism: if the invoice status somehow got out of sync with the order, the edge function corrects it instead of sending an unwanted reminder.

### Files to modify
1. `supabase/functions/send-invoice-payment-reminders/index.ts` — Add `status_invoice_paid` guard + auto-correct invoice status

