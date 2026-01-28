

# Add Client Notifications for Admin Support Replies

## Overview

Implement notifications for clients when an admin replies to their support inquiry, allowing clients to know when they have a new response without constantly checking.

## Current State

**Admin → Client notification flow is missing:**
- When admin replies via `InquiryDetail.tsx`, it directly inserts to `support_replies` table
- No notification is created for the client who submitted the inquiry
- Client header (`ClientHeader.tsx`) has no notification bell - clients can't see any notifications

**Existing infrastructure:**
- `NotificationService` handles CRUD for notifications + real-time subscriptions
- `NotificationCenter` component displays notifications with click-to-navigate
- `notifications` table stores all notifications with `user_id`, `action_url`, etc.

## Solution

### Part 1: Add Notification Bell to Client Header

**File**: `src/components/client-portal/ClientHeader.tsx`

Import and add the existing `NotificationCenter` component:

```tsx
import NotificationCenter from "@/components/notifications/NotificationCenter";

// In the header JSX, add before DarkModeToggle:
<NotificationCenter />
```

The existing NotificationCenter already:
- Fetches notifications filtered by current user ID
- Subscribes to real-time updates
- Marks as read on click
- Navigates to action_url

### Part 2: Create Client Notification Function

**File**: `src/services/clientSupportService.ts`

Add a new function to notify the inquiry owner when someone (admin) replies:

```typescript
/**
 * Notify the inquiry owner (client) about a new reply
 */
async function notifyInquiryOwner(params: {
  inquiryId: string;
  inquiryUserId: string;
  inquirySubject: string;
  replierName: string;
}): Promise<void> {
  try {
    const { error } = await supabase
      .from("notifications")
      .insert({
        user_id: params.inquiryUserId,
        title: "New Reply to Your Inquiry",
        message: `${params.replierName} replied to: "${params.inquirySubject}"`,
        type: "info",
        action_url: `/client/support/${params.inquiryId}`,
        read: false
      });

    if (error) {
      console.error("Error notifying inquiry owner:", error);
    }
  } catch (error) {
    console.error("Error in notifyInquiryOwner:", error);
  }
}
```

### Part 3: Update Admin Reply Flow

**File**: `src/components/support/InquiryDetail.tsx`

Modify `handleSubmitReply()` to notify the client after admin successfully submits a reply:

```typescript
// After successful reply insert, if admin replied, notify the client
if (isAdmin && inquiry.user_id !== user.id) {
  // Import and call notification function
  await supabase
    .from("notifications")
    .insert({
      user_id: inquiry.user_id,
      title: "New Reply to Your Inquiry",
      message: `${user.full_name || 'Support Team'} replied to: "${inquiry.subject}"`,
      type: "info",
      action_url: `/client/support/${inquiry.id}`,
      read: false
    });
}
```

**Alternative approach**: Create an exported function in clientSupportService.ts that InquiryDetail.tsx can call.

## Data Flow

```text
Admin Panel                          Client Portal
┌──────────────────┐                ┌──────────────────┐
│ InquiryDetail    │                │ ClientHeader     │
│                  │                │ ┌──────────────┐ │
│ [Reply Form]     │                │ │ 🔔 (2)       │ │
│ [Send Reply] ────┼───┐            │ └──────────────┘ │
└──────────────────┘   │            │                  │
                       │            │ ClientSupport    │
                       ▼            │ Detail           │
              ┌─────────────────┐   │ Shows replies    │
              │ support_replies │   └────────┬─────────┘
              │ + notification  │            │
              │   insert        │            │
              └────────┬────────┘            │
                       │                     │
                       ▼                     │
              ┌─────────────────┐            │
              │ notifications   │────────────┘
              │ (client's row)  │  Real-time subscription
              └─────────────────┘  triggers bell update
```

## Files to Modify

| File | Change |
|------|--------|
| `src/components/client-portal/ClientHeader.tsx` | Add NotificationCenter component |
| `src/components/support/InquiryDetail.tsx` | Add notification insert after admin reply |
| `src/services/clientSupportService.ts` | (Optional) Add exportable notifyInquiryOwner function |

## Implementation Details

### ClientHeader.tsx Changes

```tsx
import NotificationCenter from "@/components/notifications/NotificationCenter";

const ClientHeader = () => {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Building2 className="h-6 w-6 text-primary" />
        <span className="font-medium text-foreground">
          Welcome, {user?.full_name || user?.email}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <NotificationCenter />  {/* ADD THIS */}
        <DarkModeToggle />
        <Button ... >
          <LogOut ... />
        </Button>
      </div>
    </header>
  );
};
```

### InquiryDetail.tsx Changes

In the `handleSubmitReply` function, after the reply is inserted successfully:

```typescript
const handleSubmitReply = async () => {
  // ... existing reply insert code ...

  if (replyError) throw replyError;

  // NEW: Notify the client if an admin/staff replied
  if (isAdmin && inquiry.user_id !== user.id) {
    try {
      await supabase
        .from("notifications")
        .insert({
          user_id: inquiry.user_id,
          title: "New Reply to Your Inquiry",
          message: `${user.full_name || 'Support Team'} replied to: "${inquiry.subject}"`,
          type: "info" as const,
          action_url: `/client/support/${inquiry.id}`,
          read: false
        });
    } catch (notifyError) {
      console.error("Error notifying client:", notifyError);
      // Don't block the reply if notification fails
    }
  }

  // ... rest of existing code ...
};
```

## Expected Outcome

1. Client submits support inquiry
2. Admin views and replies via `/support/:id`
3. Client immediately sees notification bell badge increment (real-time)
4. Client clicks notification → marks as read → navigates to `/client/support/:id`
5. Client sees the admin's reply in the thread

## Edge Cases Handled

- **Self-reply**: If the inquiry owner replies to their own inquiry, no notification is created (condition: `inquiry.user_id !== user.id`)
- **Notification failure**: Wrapped in try/catch so reply still succeeds even if notification fails
- **Real-time sync**: Uses existing Supabase real-time subscription in NotificationCenter

