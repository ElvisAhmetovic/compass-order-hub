

## Strengthen Invoice-Order-Client Linking

### Current State

The invoice-to-order link relies on a **regex match in the `notes` field** (`Order ID: {uuid}`). This works but is fragile — if someone edits the notes, the link breaks and reminders could fail silently or skip invoices entirely.

Additionally, the client is matched by **company name** when creating an invoice, which could theoretically match the wrong client if two companies share a similar name.

The reminder function correctly uses per-invoice data (amount, invoice number) and per-order data (contact email, company name), so there's no risk of sending the wrong amount — but the linking mechanism should be made more robust.

### What Changes

**1. Add `order_id` column to the `invoices` table** (database migration)
- Add a nullable UUID column `order_id` on the `invoices` table
- This creates a direct, unbreakable link instead of relying on notes parsing

**2. Backfill existing invoices** (migration SQL)
- Extract order IDs from existing `notes` fields and populate the new `order_id` column for all current invoices

**3. Update invoice creation code** to set `order_id` directly
- `src/components/dashboard/OrderActions.tsx` — set `order_id` when creating invoice from order
- `src/components/dashboard/OrderRow.tsx` — same change

**4. Update the reminder Edge Function** to use `order_id` column
- `supabase/functions/send-invoice-payment-reminders/index.ts` — use `invoice.order_id` instead of regex parsing from notes (fall back to regex for safety)

**5. Update order-invoice sync** to use `order_id` column
- `src/services/orderService.ts` — find linked invoice by `order_id` column instead of searching all invoices by notes text

**6. Update `OrderActions.tsx` invoice lookup** to use `order_id`
- Find existing invoice by `order_id` match instead of iterating all invoices and checking notes

### Why This Matters
- Direct foreign-key-style link — no regex, no string matching
- Can't accidentally break the link by editing invoice notes
- Faster queries (column match vs. fetching all invoices and filtering in JS)
- Guarantees the right invoice data goes to the right client

