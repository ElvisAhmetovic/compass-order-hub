

# Unread Reply Indicators for Support System

## Overview

Add visual "red dot" indicators to show unread replies in the support inquiry system for both clients and admins. This requires tracking which replies each user has read.

## Current State

- Notifications are sent to bell icon when replies are added (working)
- No tracking of which replies have been "read" by which users
- No visual indicator on inquiry cards or reply messages

## Solution Design

### Part 1: Database - Track Read Status

Create a new table `support_reply_reads` to track which replies each user has read:

```sql
CREATE TABLE public.support_reply_reads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  inquiry_id UUID NOT NULL REFERENCES support_inquiries(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, inquiry_id)
);

-- RLS policies
ALTER TABLE public.support_reply_reads ENABLE ROW LEVEL SECURITY;

-- Users can manage their own read status
CREATE POLICY "Users can manage own read status"
  ON public.support_reply_reads
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### Part 2: Service Functions

**File**: `src/services/clientSupportService.ts`

Add functions to:
1. Get unread count per inquiry
2. Mark inquiry as read when opened

```typescript
// Mark an inquiry as read (updates last_read_at)
export async function markInquiryAsRead(inquiryId: string): Promise<void>

// Get unread reply count for an inquiry
export async function getUnreadReplyCount(inquiryId: string): Promise<number>
```

### Part 3: UI Updates - Inquiry Lists

**Files**: 
- `src/components/support/InquiriesList.tsx` (Admin)
- `src/pages/client/ClientSupport.tsx` (Client)

Add red dot indicator when inquiry has unread replies:

```text
┌─────────────────────────────────────────────────┐
│ [Subject Title]                      [Status]   │
│ From: Client Name                               │
│ Message preview...                              │
│                                                 │
│ Jan 28, 2026        [View (3 replies)] 🔴       │
│                                    ▲            │
│                      Red dot = unread replies   │
└─────────────────────────────────────────────────┘
```

### Part 4: UI Updates - Reply Cards

**Files**:
- `src/components/support/InquiryDetail.tsx` (Admin)
- `src/pages/client/ClientSupportDetail.tsx` (Client)

1. Show "NEW" badge on replies posted after last_read_at
2. Auto-mark as read when page loads (after small delay)

```text
┌─────────────────────────────────────────────────┐
│ [Avatar] John Doe         [Support Team] [NEW]  │
│          Jan 28, 2026 at 2:30 PM         🔴     │
│ ─────────────────────────────────────────────── │
│ Reply message content here...                   │
└─────────────────────────────────────────────────┘
```

## Data Flow

```text
User opens inquiry list
        │
        ▼
┌───────────────────────┐
│ Fetch inquiries       │
│ + unread counts       │──────────▶ Show red dot if unread > 0
└───────────────────────┘

User clicks on inquiry
        │
        ▼
┌───────────────────────┐
│ Fetch replies         │
│ + last_read_at        │──────────▶ Show "NEW" badge on replies
└───────────────────────┘            after last_read_at
        │
        │ (after 1 second delay)
        ▼
┌───────────────────────┐
│ Mark inquiry as read  │──────────▶ Update last_read_at = now()
└───────────────────────┘
```

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| Database migration | Create | Add `support_reply_reads` table |
| `src/services/supportReadService.ts` | Create | Functions to track/mark read status |
| `src/components/support/InquiriesList.tsx` | Modify | Add unread indicator to inquiry cards |
| `src/components/support/InquiryDetail.tsx` | Modify | Add NEW badge to replies, mark as read |
| `src/pages/client/ClientSupport.tsx` | Modify | Add unread indicator to client inquiry list |
| `src/pages/client/ClientSupportDetail.tsx` | Modify | Add NEW badge to replies, mark as read |

## Visual Design

### Red Dot Indicator (List)
```tsx
{unreadCount > 0 && (
  <span className="relative flex h-2.5 w-2.5">
    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
  </span>
)}
```

### NEW Badge (Reply Card)
```tsx
{isUnread && (
  <Badge className="bg-red-500 text-white text-[10px] px-1.5 py-0.5">
    NEW
  </Badge>
)}
```

## Expected Outcome

1. **Inquiry List**: Red pulsing dot appears next to inquiries with unread replies
2. **Inquiry Detail**: "NEW" badge appears on replies you haven't seen
3. **Auto-clear**: Red dot and NEW badges disappear after viewing (1 second delay)
4. **Both sides**: Works for both clients and admins
5. **Real-time**: Red dots update in real-time when new replies arrive

