

## Sync Invoice Status When Order Status Changes to "Invoice Paid"

### Problem
When the order status "Invoice Paid" is toggled from the dashboard (especially via the `MultiStatusBadges` component), the corresponding invoice in the Invoices page does not get its status updated to "paid". The sync only works from some UI paths (`OrderActions`, `OrderRow`) but not all.

### Solution
Move the invoice sync logic into `OrderService.toggleOrderStatus()` so it works universally, regardless of which UI component triggers the status change. This is the single method all components call when toggling statuses.

### Changes

**`src/services/orderService.ts`** — In `toggleOrderStatus()`, after the status is successfully updated (~line 659), add logic to find and update the linked invoice:
- When "Invoice Paid" is enabled → find invoice linked to this order (by matching `notes` containing the order ID) and update its status to `"paid"`
- When "Invoice Sent" is enabled → find/update linked invoice status to `"sent"`
- When "Invoice Paid" is disabled → revert invoice status to `"sent"` (if Invoice Sent is still active) or `"draft"`
- When "Invoice Sent" is disabled → revert invoice status to `"draft"` (if Invoice Paid is not active)

This uses the same pattern already in `OrderActions.createInvoiceFromOrder`: querying invoices where `notes` contains `Order ID: {orderId}`.

**`src/components/dashboard/MultiStatusBadges.tsx`** — No changes needed (it already calls `toggleOrderStatus`, which will now handle syncing).

**`src/components/dashboard/OrderActions.tsx`** and **`src/components/dashboard/OrderRow.tsx`** — Remove the duplicate invoice-status-update logic from `createInvoiceFromOrder` since the service layer now handles it. Keep the invoice *creation* logic but remove the redundant status sync after toggling.

### Technical Detail
```typescript
// In OrderService.toggleOrderStatus(), after successful status update:
if ((status === "Invoice Paid" || status === "Invoice Sent") && enabled) {
  const { InvoiceService } = await import('./invoiceService');
  const invoices = await InvoiceService.getInvoices();
  const linkedInvoice = invoices.find(inv => inv.notes?.includes(`Order ID: ${orderId}`));
  if (linkedInvoice) {
    const invoiceStatus = status === "Invoice Paid" ? "paid" : "sent";
    await InvoiceService.updateInvoice(linkedInvoice.id, { status: invoiceStatus });
  }
}
```

