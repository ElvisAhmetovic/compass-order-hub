

## QA Audit Results: Cross-System Payment Reminder & Invoice Sync

### Issues Found

**Issue 1 — Invoices page: `draft` status does NOT clear `next_reminder_at`**
File: `src/pages/Invoices.tsx` line 121. The `handleUpdateStatus` function only clears `next_reminder_at` for `paid`, `cancelled`, `refunded`. If a user changes an invoice back to `draft` from the Invoices page, the reminder timestamp remains set and the cron will still pick it up. The edge function's fresh-status check will catch it, but the intent should be explicit.

**Issue 2 — Invoices page: `partially_paid` is not handled**
Same location. `partially_paid` invoices keep their `next_reminder_at`. The DB trigger already clears it for `partially_paid`, but if someone manually sets the status to `partially_paid` from the dropdown (not via a payment record), the reminder stays active. Should be consistent.

**Issue 3 — `soft_delete_order` DB function does NOT clear linked invoice reminders**
The `soft_delete_order()` PL/pgSQL function only sets `status_deleted = true` and `deleted_at = now()`. It does not touch the linked invoice's `next_reminder_at`. The edge function guard we added will catch this at send time, but ideally the reminder should be cleared immediately on deletion to keep data clean.

**Issue 4 — Invoices page syncs back to order, which syncs back to invoice (double-write)**
When the Invoices page changes status to `paid` (line 144), it calls `OrderService.toggleOrderStatus(orderId, "Invoice Paid", true)`, which then finds the linked invoice and updates its status to `paid` again — a redundant write. Not a bug per se, but wasteful and could cause subtle timing issues.

### Fixes

**1. `src/pages/Invoices.tsx`** — Expand reminder clearing to cover `draft` and `partially_paid`

Change line 121:
```typescript
if (['paid', 'cancelled', 'refunded', 'draft', 'partially_paid'].includes(newStatus)) {
  updateData.next_reminder_at = null;
}
```

**2. `src/services/orderService.ts`** — Clear linked invoice reminders on soft delete

After the `soft_delete_order` RPC call succeeds (around line 417), add:
```typescript
// Clear reminders on linked invoices
try {
  const { data: linkedInvoices } = await supabase
    .from('invoices')
    .select('id')
    .eq('order_id', id);
  
  if (linkedInvoices?.length) {
    await supabase
      .from('invoices')
      .update({ next_reminder_at: null })
      .eq('order_id', id);
    console.log(`Cleared reminders for ${linkedInvoices.length} linked invoice(s)`);
  }
} catch (err) {
  console.error('Failed to clear invoice reminders on delete:', err);
}
```

Same pattern added to the cancel path in `toggleOrderStatus` — when `status === "Cancelled"` and `enabled === true`, clear linked invoice reminders.

**3. No changes needed for the double-write issue** — it's harmless (idempotent) and adding skip logic would add complexity without real benefit. The fresh-status check in the edge function is the proper safeguard.

### Summary
- 2 code files to update
- Invoices page now consistently clears reminders for all non-active statuses
- Soft-deleting or cancelling an order immediately clears linked invoice reminders (rather than waiting for the edge function to catch it)
- Edge function guards remain as the final safety net

