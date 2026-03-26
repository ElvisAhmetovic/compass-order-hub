

## Fix: Invoice Lookup Also Blocked by RLS

### Root Cause

The `sync_invoice_status` RPC correctly bypasses RLS for the UPDATE, but the code never reaches it because the SELECT query to find the linked invoice (line 762-766 in orderService.ts) also goes through RLS. The invoice SELECT policy requires `auth.uid() = user_id OR admin OR agent`. If the user toggling "Invoice Paid" on the dashboard is a regular team member (not the invoice creator, not admin/agent in `user_roles`), the SELECT returns zero rows, the code thinks there's no linked invoice, and skips the sync entirely.

### Fix

Replace the two-step approach (SELECT invoice → RPC update) with a single SECURITY DEFINER function that does both the lookup and the update internally, bypassing RLS entirely.

### Migration SQL

```sql
CREATE OR REPLACE FUNCTION public.sync_invoice_status_by_order(
  p_order_id uuid,
  p_status text,
  p_next_reminder_at timestamptz DEFAULT NULL
)
RETURNS TABLE(synced_invoice_id uuid, synced_invoice_number text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_status NOT IN ('draft', 'sent', 'paid', 'overdue', 'cancelled', 'refunded', 'partially_paid') THEN
    RAISE EXCEPTION 'Invalid invoice status: %', p_status;
  END IF;

  -- Try by order_id first, then by notes fallback
  RETURN QUERY
  UPDATE invoices
  SET status = p_status,
      next_reminder_at = p_next_reminder_at,
      updated_at = now()
  WHERE id = (
    SELECT id FROM invoices 
    WHERE order_id = p_order_id 
    LIMIT 1
  )
  RETURNING id AS synced_invoice_id, invoice_number AS synced_invoice_number;

  -- If nothing was updated, try notes-based fallback
  IF NOT FOUND THEN
    RETURN QUERY
    UPDATE invoices
    SET status = p_status,
        next_reminder_at = p_next_reminder_at,
        updated_at = now()
    WHERE id = (
      SELECT id FROM invoices 
      WHERE notes ILIKE '%Order ID: ' || p_order_id::text || '%'
      LIMIT 1
    )
    RETURNING id AS synced_invoice_id, invoice_number AS synced_invoice_number;
  END IF;
END;
$$;
```

This function:
- Looks up the invoice by `order_id` (or notes fallback) internally — no RLS
- Updates status + next_reminder_at — no RLS
- Returns the invoice ID and number so the caller knows what happened
- Validates status values
- Only callable by authenticated users

### orderService.ts Changes

Replace lines ~757-811 (the linked invoice lookup + RPC call) with a single RPC call:

```typescript
if (status === "Invoice Paid" || status === "Invoice Sent") {
  try {
    let newInvoiceStatus: string;
    if (status === "Invoice Paid" && enabled) {
      newInvoiceStatus = "paid";
    } else if (status === "Invoice Sent" && enabled) {
      newInvoiceStatus = "sent";
    } else if (status === "Invoice Paid" && !enabled) {
      const orderAfter = await this.getOrder(orderId);
      newInvoiceStatus = orderAfter?.status_invoice_sent ? "sent" : "draft";
    } else {
      const orderAfter = await this.getOrder(orderId);
      newInvoiceStatus = orderAfter?.status_invoice_paid ? "paid" : "draft";
    }

    const rpcNextReminder = newInvoiceStatus === 'sent' 
      ? new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString() 
      : null;

    console.log(`📄 Syncing invoice for order ${orderId} to "${newInvoiceStatus}" via RPC`);
    const { data: syncResult, error: rpcError } = await supabase.rpc('sync_invoice_status_by_order', {
      p_order_id: orderId,
      p_status: newInvoiceStatus,
      p_next_reminder_at: rpcNextReminder
    });

    if (rpcError) {
      console.error('📄 Invoice sync RPC error:', rpcError);
    } else if (syncResult?.length > 0) {
      console.log(`📄 Synced invoice ${syncResult[0].synced_invoice_number} to "${newInvoiceStatus}"`);
      invoiceSyncResult = { invoiceSynced: true, invoiceAction: 'updated', invoiceNumber: syncResult[0].synced_invoice_number };
    } else if (enabled) {
      // No linked invoice found — auto-create (existing auto-create logic stays)
      ...
    }
  }
}
```

The auto-create path (lines 812-894) stays as-is since the creator owns the new invoice.

Also keep the existing `sync_invoice_status` RPC for direct invoice-id-based syncs from Monthly Packages.

### Files to modify
1. **New migration** — Create `sync_invoice_status_by_order` SECURITY DEFINER function
2. **`src/services/orderService.ts`** — Replace the SELECT+RPC two-step with single `sync_invoice_status_by_order` RPC call

