

## Fix: Invoice Creation from Dashboard Not Working

### Root Cause
In `src/components/dashboard/OrderActions.tsx`, there's a broken error propagation pattern:

1. `createInvoiceFromOrder` (line 59) has its own try/catch that catches errors, shows an error toast, and **returns without re-throwing**
2. `handleCreateInvoice` (line 185) awaits `createInvoiceFromOrder` but then **always** shows a success toast (line 206), even when the inner function silently failed
3. This means errors during client creation or invoice insertion are swallowed — the user sees "Invoice Created" but nothing was actually saved

### Fix

**`src/components/dashboard/OrderActions.tsx`**

1. Make `createInvoiceFromOrder` properly propagate errors:
   - Remove the inner try/catch entirely — let errors bubble up to `handleCreateInvoice`
   - On the early `return` paths (e.g., client creation failure on line 103-111), throw an error instead of returning silently
   - On the "existing invoice found" path (line 77-87), return a truthy value or throw to distinguish from failure

2. In `handleCreateInvoice`, the existing outer try/catch (line 215) already handles errors with an error toast — so removing the inner catch is safe

3. Remove the duplicate success toast in `handleCreateInvoice` (lines 206-209) since `createInvoiceFromOrder` already shows its own success toast (line 170-173) — currently the user would see two success toasts on actual success

### Summary of changes
- Remove inner try/catch in `createInvoiceFromOrder`, let errors propagate
- Remove redundant success toast in `handleCreateInvoice` (keep the one in `createInvoiceFromOrder`)
- Ensure early-return error paths throw instead of silently returning

