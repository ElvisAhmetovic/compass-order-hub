
# Real-time Support Updates for Both Admin and Client

## Overview

Add real-time Supabase subscriptions to both admin and client support pages so they automatically update when:
- New inquiries are created
- New replies are added to existing threads
- Notification badges update and clear when clicked

## Current State Analysis

**Already working:**
- NotificationCenter has real-time subscription for new notifications (INSERT events)
- Clicking a notification marks it as read and updates local state, which clears the badge
- Admin sidebar has real-time badge for open support tickets
- InquiriesList (admin) has real-time subscription

**Missing real-time updates:**
- Client support list (`ClientSupport.tsx`) - needs to refresh when replies are added
- Client support detail (`ClientSupportDetail.tsx`) - needs to refresh when admin replies
- Admin support detail (`InquiryDetail.tsx`) - needs to refresh when client replies

## Implementation

### Part 1: Add Real-time to Client Support List

**File**: `src/pages/client/ClientSupport.tsx`

Add Supabase subscription to refresh inquiries when new replies arrive:

```typescript
// Add inside component after existing useEffect
useEffect(() => {
  const channel = supabase
    .channel('client-support-inquiries')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'support_inquiries'
    }, () => {
      loadData();
    })
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'support_replies'
    }, () => {
      loadData();
    })
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
}, []);
```

### Part 2: Add Real-time to Client Support Detail

**File**: `src/pages/client/ClientSupportDetail.tsx`

Add subscription to refresh when new replies arrive:

```typescript
// Add after existing useEffect
useEffect(() => {
  if (!ticketId) return;

  const channel = supabase
    .channel(`client-support-detail-${ticketId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'support_replies',
      filter: `inquiry_id=eq.${ticketId}`
    }, () => {
      loadInquiry();
    })
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
}, [ticketId]);
```

### Part 3: Add Real-time to Admin Support Detail

**File**: `src/components/support/InquiryDetail.tsx`

Add subscription to refresh when new replies arrive:

```typescript
// Add after existing useEffect
useEffect(() => {
  if (!inquiryId) return;

  const channel = supabase
    .channel(`admin-support-detail-${inquiryId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'support_replies',
      filter: `inquiry_id=eq.${inquiryId}`
    }, () => {
      loadInquiry();
    })
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
}, [inquiryId]);
```

## Data Flow Summary

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT PORTAL                                  │
│  ClientSupport.tsx              ClientSupportDetail.tsx                 │
│  ┌────────────────────┐         ┌────────────────────┐                 │
│  │ Real-time sub:     │         │ Real-time sub:     │                 │
│  │ - support_inquiries│         │ - support_replies  │                 │
│  │ - support_replies  │         │   (filtered by id) │                 │
│  │ → Auto-refresh list│         │ → Auto-refresh     │                 │
│  └────────────────────┘         └────────────────────┘                 │
│                                                                         │
│  ClientHeader.tsx                                                       │
│  ┌────────────────────┐                                                │
│  │ NotificationCenter │ ← Real-time notifications subscription         │
│  │ Badge clears on    │                                                │
│  │ click (marks read) │                                                │
│  └────────────────────┘                                                │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                           ADMIN PANEL                                    │
│  InquiriesList.tsx              InquiryDetail.tsx                       │
│  ┌────────────────────┐         ┌────────────────────┐                 │
│  │ Real-time sub:     │         │ Real-time sub:     │                 │
│  │ - support_inquiries│ (done)  │ - support_replies  │ ← NEW           │
│  │ - support_replies  │ (done)  │   (filtered by id) │                 │
│  │ → Auto-refresh list│         │ → Auto-refresh     │                 │
│  └────────────────────┘         └────────────────────┘                 │
│                                                                         │
│  Header.tsx + Sidebar.tsx                                               │
│  ┌────────────────────┐                                                │
│  │ NotificationCenter │ ← Real-time notifications (done)               │
│  │ + Sidebar badge    │ ← Real-time open count (done)                  │
│  └────────────────────┘                                                │
└─────────────────────────────────────────────────────────────────────────┘
```

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/client/ClientSupport.tsx` | Add real-time subscription for inquiries and replies |
| `src/pages/client/ClientSupportDetail.tsx` | Add real-time subscription for replies on current ticket |
| `src/components/support/InquiryDetail.tsx` | Add real-time subscription for replies on current inquiry |

## How Notification Badge Works (Already Implemented)

The notification badge in `NotificationCenter.tsx` already handles:

1. **Badge shows count**: `unreadCount = notifications.filter(n => !n.read).length`
2. **Click marks as read**: `handleNotificationClick()` calls `markAsRead()` and updates local state
3. **Badge disappears**: When all notifications are read, `unreadCount` becomes 0, hiding the badge

No changes needed for notification badge behavior - it already works correctly.

## Expected Outcome

After implementation:
1. Client opens support page → sees their inquiries
2. Admin replies to inquiry → Client's support detail page auto-updates with new reply
3. Client's notification bell shows badge → Client clicks → badge disappears + navigates to inquiry
4. Admin's InquiryDetail page auto-updates when client adds reply
5. Both list pages auto-refresh when new activity occurs
