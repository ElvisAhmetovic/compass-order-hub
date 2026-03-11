

## Fix: False-Positive Success Toast on Invoice Creation + Audit Other Actions

### Problem Found
The `handleCreateInvoice` function in `OrderRow.tsx` always shows "Invoice Created" success toast, even when the actual creation fails. This is because `createInvoiceFromOrder` catches errors internally and shows its own error toast, but does **not re-throw** — so `handleCreateInvoice` never enters its catch block and always reaches the success toast.

This is why the user saw "Invoice created successfully" in the console even though the `PGRST203` error was also logged.

### Audit Results

| Area | Status | Notes |
|------|--------|-------|
| Dashboard: Create Order | OK | Direct Supabase insert, no RPC calls |
| Dashboard: Delete Order | OK | Uses `soft_delete_order` RPC — single function, no ambiguity |
| Dashboard: Restore Order | OK | Uses `restore_order` RPC — single function, no ambiguity |
| Dashboard: Status Changes | OK | Direct Supabase updates |
| Dashboard: Create Invoice | **BUG** | False-positive success toast (fix below) |
| Dashboard: Status → Invoice Sent/Paid | **BUG** | Same `createInvoiceFromOrder` issue |
| Invoices Page: Create Invoice | OK | Calls `InvoiceService.createInvoice` directly, properly throws |
| Proposals: Convert to Invoice | OK | Uses `generate_invoice_number()` with no params — works with the remaining 3-param function (all defaults) |
| Monthly Packages | OK | No RPC calls, direct inserts |
| User Management: Add/Edit/Delete | OK | Direct Supabase operations or edge functions |

### Fix
In `OrderRow.tsx`:
1. Make `createInvoiceFromOrder` re-throw errors after showing error toast, so callers know it failed
2. Remove the duplicate success toast from `handleCreateInvoice` — `createInvoiceFromOrder` already shows its own success toast
3. Same fix for `handleUpdateStatus` which also calls `createInvoiceFromOrder`

### Changes
**File: `src/components/dashboard/OrderRow.tsx`**
- In `createInvoiceFromOrder`: add `throw` after error toasts so errors propagate
- In `handleCreateInvoice`: remove duplicate success toast (the inner function already shows one)

