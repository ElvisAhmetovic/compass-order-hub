

# Fix: Mark Support Notifications as Read When Viewing Inquiry

## Problem

When a support inquiry or reply is created, notifications are sent to the `notifications` table. However:
- Clicking "View" on an inquiry card navigates to the detail page
- The notification bell badge stays showing "1" because the notification was never marked as read
- The sidebar badge (admin side) shows open inquiry count, not unread notifications

## Solution

When viewing an inquiry detail page, automatically mark any related notifications as read. This needs to happen on both:
- Admin side (`InquiryDetail.tsx`)
- Client side (`ClientSupportDetail.tsx`)

## How Notifications Are Created

1. **Client creates inquiry** → Admins get notification with `action_url: /support/{inquiryId}`
2. **Client replies** → Admins get notification with `action_url: /support/{inquiryId}`
3. **Admin replies** → Client gets notification with `action_url: /client/support/{inquiryId}`

## Technical Changes

### File 1: Update supportReadService.ts

Add a new function to mark notifications as read by action_url pattern:

```typescript
/**
 * Mark notifications as read for a specific inquiry
 * This clears the bell notification when viewing the inquiry
 */
export async function markSupportNotificationsAsRead(inquiryId: string): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return;

  // Mark notifications that link to this inquiry as read
  // Matches both /support/{id} (admin) and /client/support/{id} (client)
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", userData.user.id)
    .eq("read", false)
    .or(`action_url.eq./support/${inquiryId},action_url.eq./client/support/${inquiryId}`);

  if (error) {
    console.error("Error marking support notifications as read:", error);
  }
}
```

### File 2: Update InquiryDetail.tsx (Admin)

Call the new function when marking the inquiry as read:

```typescript
import { getLastReadAt, markInquiryAsRead, markSupportNotificationsAsRead } from "@/services/supportReadService";

// In the useEffect that marks as read (lines 68-77):
useEffect(() => {
  if (!inquiryId || !inquiry || hasMarkedRead.current) return;
  
  const timer = setTimeout(async () => {
    await markInquiryAsRead(inquiryId);
    await markSupportNotificationsAsRead(inquiryId); // ADD THIS
    hasMarkedRead.current = true;
  }, 1000);

  return () => clearTimeout(timer);
}, [inquiryId, inquiry]);
```

### File 3: Update ClientSupportDetail.tsx (Client)

Same change for client side:

```typescript
import { getLastReadAt, markInquiryAsRead, markSupportNotificationsAsRead } from "@/services/supportReadService";

// In the useEffect that marks as read (lines 44-54):
useEffect(() => {
  if (!ticketId || !inquiry || hasMarkedRead.current) return;
  
  const timer = setTimeout(async () => {
    await markInquiryAsRead(ticketId);
    await markSupportNotificationsAsRead(ticketId); // ADD THIS
    hasMarkedRead.current = true;
  }, 1000);

  return () => clearTimeout(timer);
}, [ticketId, inquiry]);
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/services/supportReadService.ts` | Add `markSupportNotificationsAsRead()` function |
| `src/components/support/InquiryDetail.tsx` | Call `markSupportNotificationsAsRead()` when viewing |
| `src/pages/client/ClientSupportDetail.tsx` | Call `markSupportNotificationsAsRead()` when viewing |

## Expected Outcome

1. User clicks on inquiry card → navigates to detail page
2. After 1 second delay (same as existing "mark as read" logic):
   - `support_reply_reads` table is updated (existing behavior)
   - `notifications` table is updated to mark matching notifications as read (new)
3. Bell notification badge decrements automatically
4. Sidebar red dot (unread replies) clears (existing behavior)

## Why 1-Second Delay?

The delay ensures users have time to see the "NEW" badges on replies before they're cleared. This matches the existing behavior for the unread reply tracking.

