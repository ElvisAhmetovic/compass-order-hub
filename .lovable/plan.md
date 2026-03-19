

## Fix: Auto-Create/Sync Invoice When "Invoice Paid" Is Toggled from Any UI

### Problem
When you toggle "Invoice Paid" (or "Invoice Sent") via the status badges `+` button (`MultiStatusBadges` component), no invoice gets created in the Invoices section. The invoice creation logic only exists in `OrderRow` and `OrderActions`, but not in `MultiStatusBadges` — which is the component behind the `+` button and badge clicks.

### Solution
Centralize the invoice auto-creation inside `OrderService.toggleOrderStatus` so that ALL callers automatically get invoice creation behavior. This eliminates the duplication across `OrderRow` and `OrderActions` and ensures every status toggle path works consistently.

### Changes

**`src/services/orderService.ts`** — In `toggleOrderStatus`, after the existing invoice sync block (lines 714-752), add logic to **create** a new invoice if none is linked yet when "Invoice Sent" or "Invoice Paid" is enabled:
- After checking for a linked invoice and finding none, auto-create one using `InvoiceService.createClient` + `InvoiceService.createInvoice`
- Link it to the order via `order_id`
- Set the correct status ("sent" or "paid")
- Parse `inventory_items` from the order for line items (same logic currently in OrderRow/OrderActions)

**`src/components/dashboard/MultiStatusBadges.tsx`** — No changes needed (it already calls `toggleOrderStatus`, which will now handle everything).

**`src/components/dashboard/OrderRow.tsx`** and **`src/components/dashboard/OrderActions.tsx`** — Remove the duplicate `createInvoiceFromOrder` calls after `toggleOrderStatus`, since the service now handles it internally. Keep the standalone "Create Invoice" button logic in OrderActions as-is (that's a manual action, not status-driven).

### Result
Toggling "Invoice Paid" from any UI element (badges, `+` button, dropdown menu, `...` menu) will automatically create or update the corresponding invoice in the Invoices section.

