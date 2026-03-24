

## Sync Invoice "Sent" Status to Order Dashboard

### Problem
When an invoice is marked as "sent" (via sending an invoice email, sending a PDF, or manually changing status on the Invoices page), the linked order on the dashboard does NOT get its "Invoice Sent" status toggled on. The sync only works in the reverse direction (toggling "Invoice Sent" on the dashboard updates the invoice).

### Root Cause
Three code paths update invoice status to 'sent' without calling `OrderService.toggleOrderStatus` on the linked order:

1. **`SendInvoiceDialog.tsx`** (line ~128-133) — sends invoice email, marks invoice as 'sent', but never updates the order
2. **`SendInvoicePDFDialog.tsx`** (line ~91-96) — sends invoice PDF, marks invoice as 'sent', but never updates the order
3. **`Invoices.tsx` `handleUpdateStatus`** (line ~112-145) — manual status change on Invoices page, never syncs to order

### Fix
After each of these sets the invoice status to 'sent', add a check: if the invoice has a linked `order_id`, call `OrderService.toggleOrderStatus(order_id, "Invoice Sent", true)` to sync the dashboard status.

Similarly, when invoice status changes to 'paid', sync `"Invoice Paid"` to the order. And when it changes away from 'sent'/'paid', toggle those off.

### Files to Change

**1. `src/components/invoices/SendInvoiceDialog.tsx`**
- After updating invoice status to 'sent' (line ~132), look up the invoice's `order_id` and call `OrderService.toggleOrderStatus(orderId, "Invoice Sent", true)`

**2. `src/components/invoices/SendInvoicePDFDialog.tsx`**
- Same logic after marking invoice as 'sent' (line ~95)

**3. `src/pages/Invoices.tsx`**
- In `handleUpdateStatus`, after updating the invoice status, check if the invoice has an `order_id` and sync the corresponding order status:
  - 'sent' → toggle "Invoice Sent" on
  - 'paid' → toggle "Invoice Paid" on, toggle "Invoice Sent" off
  - 'draft'/'cancelled' → toggle both off

### Technical Detail
- Uses existing `OrderService.toggleOrderStatus` which already handles the order update and dispatches the `orderStatusChanged` event for dashboard refresh
- The invoice's `order_id` field links invoices to orders — already exists in the schema
- Need to fetch `order_id` from the invoice record (it may already be available in the component's invoice object)

