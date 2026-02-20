

# Fix: Intermittent "Failed to Fetch" Errors Across All Live Domains

## Problem

The app makes too many simultaneous Supabase requests on every page load, intermittently exhausting the connection pool or hitting rate limits. The main offenders:

1. **N+1 payment reminder queries**: Each of the 10 visible `OrderRow` components independently calls `PaymentReminderService.getReminderForOrder(order.id)` -- 10 parallel requests just for reminders on one page.
2. **Duplicate Realtime channels**: Both `Sidebar` and `NotificationCenter` open separate Realtime subscriptions to the same `notifications` table for the same user.
3. **Auth race condition**: `AuthContext` wraps `convertToAuthUser` in a `setTimeout` inside `onAuthStateChange`, causing duplicate profile/role lookups.
4. **No retry logic**: Any transient network hiccup immediately surfaces as "failed to fetch" with no recovery.

## Solution

### 1. Batch payment reminder queries in OrderTable

Instead of each `OrderRow` fetching its own reminder, `OrderTable` will do a single batch query for all visible order IDs and pass the results down as props.

**Files**: `src/components/dashboard/OrderTable.tsx`, `src/components/dashboard/OrderRow.tsx`

- In `OrderTable`: after fetching orders and slicing to the current page, query `payment_reminders` with `.in('order_id', currentOrderIds)` in one call
- Pass the matched reminder (or null) to each `OrderRow` via a new `paymentReminder` prop
- In `OrderRow`: remove the `useEffect` that calls `PaymentReminderService.getReminderForOrder` and use the prop instead; keep `handleReminderUpdated` for manual refresh after user actions

### 2. Create a shared useNotifications hook

Consolidate the duplicate Realtime subscriptions from Sidebar and NotificationCenter into one shared hook.

**Files**: `src/hooks/useNotifications.ts` (new), `src/components/dashboard/Sidebar.tsx`, `src/components/notifications/NotificationCenter.tsx`

- The hook manages a single Realtime channel for the `notifications` table
- Exposes: `notifications`, `unreadCount`, `unreadSupportCount`, `markAsRead`, `markAllAsRead`, `refetch`
- Both Sidebar and NotificationCenter consume this hook instead of managing their own subscriptions

### 3. Add a fetchWithRetry utility

Wrap critical Supabase queries so transient failures retry automatically (up to 2 retries with increasing delay).

**File**: `src/utils/fetchWithRetry.ts` (new)

```text
fetchWithRetry(fn, maxRetries=2, baseDelay=500)
  - Attempt 1: call fn()
  - On failure: wait 500ms, retry
  - On second failure: wait 1000ms, retry
  - On third failure: throw
```

Apply it to:
- `OrderTable.fetchOrders`
- `OrderSearchDropdown.loadOrders`
- `useNotifications` initial fetch

### 4. Fix AuthContext race condition

Remove the `setTimeout` wrapper in `onAuthStateChange` and add a deduplication ref to prevent `convertToAuthUser` from running concurrently.

**File**: `src/context/AuthContext.tsx`

- Add a `convertingRef` (useRef boolean) that prevents overlapping calls to `convertToAuthUser`
- Replace the `setTimeout(async () => ...)` in `onAuthStateChange` with a direct async call guarded by the ref
- This eliminates duplicate profile + role queries on every auth state change

## Expected Impact

| Metric | Before | After |
|--------|--------|-------|
| Payment reminder requests per page | 10 (one per row) | 1 (batch) |
| Notification Realtime channels | 2 | 1 (shared) |
| Auth profile/role queries on login | 2-4 (race condition) | 1 |
| Transient failure behavior | Immediate error shown | Auto-retry up to 2x |

## Files Summary

| File | Action |
|------|--------|
| `src/utils/fetchWithRetry.ts` | Create -- retry utility |
| `src/hooks/useNotifications.ts` | Create -- shared notifications hook |
| `src/components/dashboard/OrderTable.tsx` | Edit -- batch payment reminder query, pass as props |
| `src/components/dashboard/OrderRow.tsx` | Edit -- accept `paymentReminder` prop, remove self-fetch |
| `src/components/dashboard/Sidebar.tsx` | Edit -- use shared `useNotifications` hook |
| `src/components/notifications/NotificationCenter.tsx` | Edit -- use shared `useNotifications` hook |
| `src/context/AuthContext.tsx` | Edit -- remove setTimeout, add dedup ref |
| `src/components/dashboard/OrderSearchDropdown.tsx` | Edit -- wrap loadOrders with fetchWithRetry |

