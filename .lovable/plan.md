

## Fix: Invoice Status Not Syncing When Dashboard Status Changes

### Root Cause
The `Invoice` TypeScript interface is missing the `order_id` field, even though the database column exists. This forces `as any` casts throughout the sync logic, and the `updateInvoice` method uses `.single()` which can silently fail under RLS. Additionally, `getInvoices()` fetches ALL invoices just to find one by `order_id` — inefficient and error-prone.

### Changes

**1. `src/types/invoice.ts`** — Add `order_id` to the `Invoice` interface:
- Add `order_id?: string | null` field
- Add `reminder_count?: number` and `next_reminder_at?: string | null` and `last_reminder_sent_at?: string | null` fields (also present in DB but missing from type)

**2. `src/services/invoiceService.ts`** — Make `updateInvoice` resilient:
- Replace `.single()` with `.select()` and `data?.[0]` to avoid RLS-related failures (per project convention)

**3. `src/services/orderService.ts`** — Replace the inefficient full-table scan with a direct query:
- Instead of `getInvoices()` + `.find()`, query Supabase directly: `supabase.from('invoices').select('*').eq('order_id', orderId).limit(1)`
- Fall back to notes-based search only if no direct match found
- Remove all `as any` casts now that the type includes `order_id`

### Result
When you toggle "Invoice Paid" or "Invoice Sent" on the dashboard, the linked invoice in the Invoices section will reliably update its status (or get auto-created if it doesn't exist yet).

