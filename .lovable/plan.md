
# Add Supabase Realtime Subscriptions to Client Portal

## Overview
Implement real-time order updates in the Client Portal so clients see status changes instantly without needing to refresh the page. This will follow existing patterns used elsewhere in the codebase (e.g., `activityService`, `notificationService`, `useGlobalChatNotifications`).

---

## Current State Analysis

### How Realtime Currently Works in the App
The codebase has established patterns for Supabase Realtime:
- **activityService.ts**: Subscribes to `team_activities` table with cleanup function
- **notificationService.ts**: Subscribes to `notifications` table with user-specific filter
- **useGlobalChatNotifications.ts**: Full hook implementation with connection state tracking
- **SmartAlerts.tsx**: Subscribes to `orders` UPDATE events (admin side)

### What's Missing for Client Portal
1. **Database**: The `orders` table is NOT enabled for Realtime (no `REPLICA IDENTITY FULL` or publication)
2. **Service Layer**: No subscription method in `clientOrderService.ts`
3. **Components**: Client Portal pages use one-time data fetching, no subscriptions

---

## Implementation Plan

### Phase 1: Enable Realtime for Orders Table

**Database Migration Required**

Create a new migration to enable realtime for the `orders` table:

```sql
-- Enable realtime for orders table
ALTER TABLE orders REPLICA IDENTITY FULL;

-- Add the table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
```

This follows the exact pattern used for `team_activities` and `reactions` tables.

---

### Phase 2: Create Client Orders Realtime Hook

**New File: `src/hooks/useClientOrdersRealtime.ts`**

A custom hook that:
- Subscribes to the `orders` table for UPDATE events
- Filters changes relevant to the current client (using `client_id`)
- Provides callbacks when orders are updated
- Properly cleans up subscriptions on unmount
- Tracks connection status

```typescript
// Hook structure
export const useClientOrdersRealtime = (
  onOrderUpdate: (orderId: string) => void
) => {
  // Subscribe to orders table UPDATE events
  // Filter by client_id matching current user
  // Return cleanup function and connection status
};
```

---

### Phase 3: Integrate Realtime into Client Portal Components

#### 3.1 ClientDashboard.tsx

Update to use the realtime hook:
- Subscribe to order updates on mount
- Refetch dashboard data when an order is updated
- Show a toast notification for status changes
- Display connection indicator (optional)

#### 3.2 ClientOrders.tsx

Update to use the realtime hook:
- Subscribe to order updates on mount
- Update the orders list when changes occur
- Show visual feedback (subtle flash on updated order cards)

#### 3.3 ClientOrderDetail.tsx

Update to use the realtime hook:
- Subscribe specifically to the current order being viewed
- Auto-refresh order data when status changes
- Show toast notification with the new status

---

### Phase 4: Add Subscription to Service Layer

**Update: `src/services/clientOrderService.ts`**

Add a new function for subscribing to client order updates:

```typescript
export const subscribeToClientOrders = (
  userId: string,
  onUpdate: (order: ClientOrder) => void,
  onInsert?: (order: ClientOrder) => void
): (() => void) => {
  // Create channel with unique name
  // Subscribe to orders table with client_id filter
  // Return cleanup function
};
```

---

## Technical Details

### Realtime Channel Configuration

```typescript
const channel = supabase
  .channel(`client-orders-${userId}`)
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'orders',
    filter: `client_id=eq.${userId}`
  }, (payload) => {
    // Handle update
  })
  .subscribe();
```

### Security Considerations

- Realtime uses RLS policies, so clients can only receive events for orders they have access to
- The `client_id` filter on the subscription provides additional client-side filtering
- Existing RLS policy on `orders` table: `client_id = auth.uid()` ensures data isolation

### Connection State Management

The hook will track:
- `isConnected`: Boolean indicating active subscription
- Error handling for subscription failures
- Automatic reconnection (handled by Supabase SDK)

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `supabase/migrations/[timestamp].sql` | Create | Enable realtime for orders table |
| `src/hooks/useClientOrdersRealtime.ts` | Create | Custom hook for realtime subscriptions |
| `src/services/clientOrderService.ts` | Modify | Add subscription helper function |
| `src/pages/client/ClientDashboard.tsx` | Modify | Integrate realtime hook |
| `src/pages/client/ClientOrders.tsx` | Modify | Integrate realtime hook |
| `src/pages/client/ClientOrderDetail.tsx` | Modify | Integrate realtime hook for single order |

---

## User Experience Improvements

### Visual Feedback
- **Toast Notification**: When an order status changes, show a friendly message like "Your order status has been updated"
- **Badge Pulse**: Briefly highlight the updated order card
- **Stats Auto-Update**: Dashboard stats update in real-time

### Connection Status (Optional)
- Small indicator showing realtime connection is active
- Graceful fallback if connection drops (manual refresh available)

---

## Summary of Changes

1. **Database**: Enable `orders` table for Supabase Realtime publication
2. **Hook**: Create `useClientOrdersRealtime` hook following existing patterns
3. **Service**: Add subscription helper to `clientOrderService.ts`
4. **Dashboard**: Auto-refresh stats and recent orders on updates
5. **Orders List**: Update list in real-time when status changes
6. **Order Detail**: Refresh current order when it gets updated

This implementation ensures clients always see the latest order status without manual refresh, improving the overall user experience of the Client Portal.
