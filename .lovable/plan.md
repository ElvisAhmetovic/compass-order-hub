

# Client-Admin Support Inquiry Flow with Notifications

## Overview

Enable a complete notification flow where:
1. Clients create support inquiries at `/client/support`
2. Admins receive real-time notifications in the header notification center
3. Notifications link directly to the inquiry and mark as read when clicked
4. Support sidebar shows unread count badge

## Current State Analysis

The support system already works for basic operations:
- Clients create inquiries → stored in `support_inquiries` table
- Admins view all inquiries at `/support`
- Both sides can reply via `support_replies` table
- Client sees admin replies, admin sees client replies

**Missing pieces:**
- No notification created when client submits inquiry
- No notification when client replies to existing thread
- Admin sidebar doesn't show unread support ticket count
- No real-time updates on admin side

## Technical Implementation

### Part 1: Create Notifications When Client Submits Inquiry

**File**: `src/services/clientSupportService.ts`

Update `createClientInquiry()` to trigger admin notifications after successful insert:

```typescript
// After successful inquiry creation, notify all admin users
const { data: admins } = await supabase
  .from("user_roles")
  .select("user_id")
  .eq("role", "admin");

if (admins && admins.length > 0) {
  const notifications = admins.map(admin => ({
    user_id: admin.user_id,
    title: "New Support Inquiry",
    message: `${userName} submitted: "${params.subject}"`,
    type: "info" as const,
    action_url: `/support/${data.id}`,
    read: false
  }));

  await supabase.from("notifications").insert(notifications);
}
```

### Part 2: Create Notifications When Client Replies

**File**: `src/services/clientSupportService.ts`

Update `addClientReply()` to notify admins when a client adds a reply:

```typescript
// Only notify if the replier is a client
if (profile?.role === "client") {
  // Get inquiry details for context
  const { data: inquiry } = await supabase
    .from("support_inquiries")
    .select("subject")
    .eq("id", inquiryId)
    .single();

  // Notify all admins
  const { data: admins } = await supabase
    .from("user_roles")
    .select("user_id")
    .eq("role", "admin");

  if (admins && inquiry) {
    const notifications = admins.map(admin => ({
      user_id: admin.user_id,
      title: "New Support Reply",
      message: `${userName} replied to: "${inquiry.subject}"`,
      type: "info" as const,
      action_url: `/support/${inquiryId}`,
      read: false
    }));

    await supabase.from("notifications").insert(notifications);
  }
}
```

### Part 3: Add Support Badge to Admin Sidebar

**File**: `src/components/dashboard/Sidebar.tsx`

Add unread support inquiry count badge next to Support menu item:

1. Create a hook or inline query to count open inquiries
2. Display badge with count on the Support navigation link
3. Subscribe to real-time changes on `support_inquiries` table

```typescript
// Query for open support inquiries count
const [openSupportCount, setOpenSupportCount] = useState(0);

useEffect(() => {
  if (isAdmin) {
    const fetchCount = async () => {
      const { count } = await supabase
        .from("support_inquiries")
        .select("*", { count: "exact", head: true })
        .eq("status", "open");
      setOpenSupportCount(count || 0);
    };
    
    fetchCount();
    
    // Real-time subscription
    const channel = supabase
      .channel("support-inquiries-count")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "support_inquiries"
      }, () => fetchCount())
      .subscribe();
      
    return () => { channel.unsubscribe(); };
  }
}, [isAdmin]);
```

### Part 4: Mark Notification as Read on Click

**File**: `src/components/notifications/NotificationCenter.tsx`

When user clicks a notification with an `action_url`:
1. Mark it as read
2. Navigate to the linked page

The current implementation already has `handleMarkAsRead()`, but we need to ensure clicking the notification itself triggers navigation AND marks as read:

```typescript
const handleNotificationClick = async (notification: Notification) => {
  // Mark as read
  await NotificationService.markAsRead(notification.id);
  setNotifications(prev => 
    prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
  );
  
  // Navigate if action_url exists
  if (notification.action_url) {
    setIsOpen(false);
    window.location.href = notification.action_url;
  }
};
```

### Part 5: Real-time Updates for Admin Support List

**File**: `src/components/support/InquiriesList.tsx`

Add Supabase realtime subscription to automatically refresh when new inquiries arrive:

```typescript
useEffect(() => {
  if (!user || !isAdmin) return;
  
  const channel = supabase
    .channel("admin-support-inquiries")
    .on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "support_inquiries"
    }, () => {
      loadInquiries(); // Refresh the list
    })
    .subscribe();
    
  return () => { channel.unsubscribe(); };
}, [user, isAdmin]);
```

## Data Flow Diagram

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT PORTAL                                  │
│  /client/support                                                        │
│  ┌──────────────────┐                                                   │
│  │  Create Inquiry  │──────────────────┐                                │
│  └──────────────────┘                  │                                │
│  ┌──────────────────┐                  │                                │
│  │  Reply to Thread │──────────────────┤                                │
│  └──────────────────┘                  │                                │
└────────────────────────────────────────│────────────────────────────────┘
                                         │
                                         ▼
                              ┌─────────────────────┐
                              │  support_inquiries  │
                              │  support_replies    │
                              │  notifications      │  ← New rows inserted
                              └─────────────────────┘
                                         │
                   ┌─────────────────────┼─────────────────────┐
                   │                     │                     │
                   ▼                     ▼                     ▼
         ┌──────────────┐      ┌──────────────┐      ┌──────────────┐
         │  Realtime    │      │  Realtime    │      │  Realtime    │
         │  Subscription│      │  Subscription│      │  Subscription│
         └──────────────┘      └──────────────┘      └──────────────┘
                   │                     │                     │
                   ▼                     ▼                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           ADMIN PANEL                                    │
│  ┌──────────────┐   ┌──────────────────┐   ┌────────────────────────┐  │
│  │  Sidebar     │   │ NotificationCenter│   │  InquiriesList        │  │
│  │  Badge: (3)  │   │  Bell: (3)       │   │  Auto-refreshes       │  │
│  └──────────────┘   └──────────────────┘   └────────────────────────┘  │
│                            │                                            │
│                            │ Click notification                         │
│                            ▼                                            │
│                     ┌──────────────────┐                                │
│                     │ Mark as read     │                                │
│                     │ Navigate to      │                                │
│                     │ /support/:id     │                                │
│                     └──────────────────┘                                │
└─────────────────────────────────────────────────────────────────────────┘
```

## Files to Modify

| File | Change |
|------|--------|
| `src/services/clientSupportService.ts` | Add admin notifications on inquiry creation and client replies |
| `src/components/dashboard/Sidebar.tsx` | Add open support ticket count badge with real-time updates |
| `src/components/notifications/NotificationCenter.tsx` | Add click handler to mark as read and navigate |
| `src/components/support/InquiriesList.tsx` | Add real-time subscription for auto-refresh |

## Route Fix

The current route `/support/:id` uses param name `id` but `InquiryDetail.tsx` uses `inquiryId`. Need to sync:

**File**: `src/App.tsx` - Change route to `/support/:inquiryId` OR update `InquiryDetail.tsx` to use `id`.

Recommend updating `InquiryDetail.tsx`:
```typescript
const { id: inquiryId } = useParams<{ id: string }>();
```

## Expected Outcome

After implementation:
1. Client creates inquiry → Admin sees notification bell badge increment
2. Admin clicks notification → navigates to `/support/{inquiry_id}`, notification marked as read
3. Admin sidebar shows badge with open support ticket count
4. Admin support list updates in real-time when new inquiries arrive
5. Client replies to thread → Admin gets new notification
6. Admin replies → Client sees reply on their detail page (already works)

