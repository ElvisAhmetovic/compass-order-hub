

# Fix: Order Search Dropdown Shows "No Orders Available"

## Root Cause

When you open the Create Order modal and click "Search existing orders to autofill," the `OrderSearchDropdown` component calls `OrderService.getOrders()` and `OrderService.getYearlyPackages()` simultaneously. If these requests fail (due to the intermittent rate-limiting / connection issue), the error is caught silently and `orders` stays as an empty array, showing "No orders available" with no way to retry.

This is directly related to the broader "failed to fetch" issue -- the dropdown is a victim of the same overloaded request pattern.

## Fix

### `src/components/dashboard/OrderSearchDropdown.tsx`

1. **Add an error state** so users see "Failed to load orders" instead of the misleading "No orders available"
2. **Add a "Retry" button** when loading fails, so users can try again without closing/reopening the modal
3. **Add retry logic** inside `loadOrders` -- automatically retry once after a short delay before showing the error
4. **Reset orders on each open** -- remove the `orders.length === 0` guard so orders are refreshed each time the dropdown opens (the stale cache from a previous failed load was preventing retries)

### Changes in detail

```text
Current flow:
  Open dropdown --> if orders empty, fetch --> if fetch fails, show "No orders available"

New flow:
  Open dropdown --> fetch (with 1 auto-retry) --> if still fails, show error + Retry button
```

## Technical details

- Add `error` state (`boolean`)
- In `loadOrders`: wrap in try/catch with one automatic retry (500ms delay), set `error = true` on final failure
- In the `useEffect` that triggers on `isOpen`: always call `loadOrders()` when opening (remove `orders.length === 0` check)
- In the JSX: when `error` is true, show "Failed to load orders" message with a Retry button that calls `loadOrders()`
- The Retry button resets the error state and tries again

## File to modify

| File | Change |
|------|--------|
| `src/components/dashboard/OrderSearchDropdown.tsx` | Add error state, retry logic, and retry button |

Single file change. No impact on other components.

