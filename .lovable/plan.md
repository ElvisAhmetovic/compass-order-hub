

## QA Audit: Ensure `next_reminder_at` Is Cleared on All Status Change Paths

### Issues Found

**Issue 1 — `orderService.ts` line 755: `draft` status doesn't clear `next_reminder_at`**
When "Invoice Paid" is toggled OFF and "Invoice Sent" is also off, the invoice goes to `draft` — but `next_reminder_at` is NOT set to null. This means a previously-scheduled reminder could still fire for a draft invoice.

**Issue 2 — `orderService.ts` line 826: auto-created invoice with `paid` status doesn't clear `next_reminder_at`**
When toggling "Invoice Paid" ON and no invoice exists, a new invoice is auto-created with status `paid`, but `next_reminder_at` is only set for `sent` — not explicitly nulled for `paid`. While a new invoice won't have `next_reminder_at` set, being explicit is safer for future-proofing.

**Issue 3 — Edge function doesn't clear `next_reminder_at` for invoices with deleted/cancelled orders**
If an order is soft-deleted (`status_deleted = true`) or cancelled (`status_cancelled = true`), the edge function still sends reminders for linked invoices. It should skip these.

### Fixes (2 files)

**1. `src/services/orderService.ts`** — 2 changes

Change at line 755-761: Handle `draft` and any non-active status by clearing `next_reminder_at`:
```typescript
const updateData: Record<string, any> = { status: newInvoiceStatus };

if (newInvoiceStatus === 'sent') {
  updateData.next_reminder_at = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
} else {
  // Clear reminders for paid, draft, cancelled, refunded — anything non-sent
  updateData.next_reminder_at = null;
}
```

Same pattern at line 827-833 for auto-created invoices:
```typescript
if (invoiceStatus === 'sent') {
  invoiceUpdateData.next_reminder_at = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
} else {
  invoiceUpdateData.next_reminder_at = null;
}
```

**2. `supabase/functions/send-invoice-payment-reminders/index.ts`** — 1 change

After fetching the order (line ~435), add a check to skip deleted or cancelled orders:
```typescript
if (orderError || !order) {
  console.log(`Skipping invoice ${invoice.invoice_number} - order not found`);
  continue;
}

// Skip reminders for deleted or cancelled orders
if (order.status_deleted || order.status_cancelled) {
  console.log(`Skipping invoice ${invoice.invoice_number} - order is ${order.status_deleted ? 'deleted' : 'cancelled'}`);
  // Clear the reminder so it doesn't keep getting picked up
  await supabase.from("invoices").update({ next_reminder_at: null }).eq("id", invoice.id);
  continue;
}
```

### Summary
- 3 gaps found across 2 files
- All paths now use the pattern: only `sent`/`overdue` get reminders scheduled; everything else clears `next_reminder_at` to null
- Edge function additionally guards against deleted/cancelled orders

