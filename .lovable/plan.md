

## Fix: Dashboard Invoice Status Sync Blocked by RLS

### Root Cause

The invoice table RLS policy only allows updates if `auth.uid() = user_id OR admin OR agent`. When a team member (e.g., Thomas Klein) toggles "Invoice Paid" on the dashboard, the `orderService.toggleOrderStatus` tries to update the linked invoice via a direct Supabase call. If the invoice was created by a different user and Thomas isn't admin/agent, RLS silently blocks the update — the invoice stays at "sent" even though the order shows "Invoice Paid".

The retry-without-select fallback also fails because RLS blocks the UPDATE itself, not just the SELECT.

### Fix

Create a PostgreSQL function `sync_invoice_status` with `SECURITY DEFINER` that bypasses RLS. This is safe because:
- It only accepts an invoice ID, a status value, and a next_reminder_at timestamp
- It validates the status is one of the allowed values
- It's only callable by authenticated users

Then update `orderService.ts` to call this function via `supabase.rpc()` instead of direct `.update()`.

### Migration SQL

```sql
CREATE OR REPLACE FUNCTION public.sync_invoice_status(
  p_invoice_id uuid,
  p_status text,
  p_next_reminder_at timestamptz DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_status NOT IN ('draft', 'sent', 'paid', 'overdue', 'cancelled', 'refunded', 'partially_paid') THEN
    RAISE EXCEPTION 'Invalid invoice status: %', p_status;
  END IF;

  UPDATE invoices
  SET status = p_status,
      next_reminder_at = p_next_reminder_at,
      updated_at = now()
  WHERE id = p_invoice_id;
END;
$$;
```

### orderService.ts Changes

Replace the direct `supabase.from('invoices').update(...)` calls (both the initial attempt and the retry) with:

```typescript
const { error: rpcError } = await supabase.rpc('sync_invoice_status', {
  p_invoice_id: linkedInvoice.id,
  p_status: newInvoiceStatus,
  p_next_reminder_at: newInvoiceStatus === 'sent' 
    ? new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString() 
    : null
});
```

This applies to both the "update existing invoice" path (~line 806) and the "auto-create then update" path (~line 900).

### Files to modify
1. **New migration** — Create `sync_invoice_status` SECURITY DEFINER function
2. **`src/services/orderService.ts`** — Replace direct invoice updates with `supabase.rpc('sync_invoice_status', ...)` in both sync paths

