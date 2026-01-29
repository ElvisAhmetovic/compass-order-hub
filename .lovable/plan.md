
## What’s happening (why the “1” doesn’t go away)
From your screenshot, the “1” next to **Support** in the left sidebar is coming from `src/components/dashboard/Sidebar.tsx`. Right now it is **not a notification badge**—it’s counting how many `support_inquiries` have `status = 'open'`. Viewing an inquiry doesn’t change its status, so the badge stays “1” until the inquiry is closed.

Separately, even for the **bell notifications** in the header, our DB update can succeed but the UI may still show “1” because `NotificationCenter` only listens for **INSERT** realtime events and doesn’t react to **UPDATE** events (like `read: true`).

We will fix both so the “notification badge” behavior matches what you expect.

---

## Goals
1. Sidebar Support badge should represent **unread support notifications** (or unread support items), and clear automatically when you open the inquiry.
2. The header bell badge should update immediately when notifications are marked read from anywhere (including when opening an inquiry detail page), without needing a refresh.
3. Works on both internal/admin routes and client portal routes.

---

## Implementation plan

### 1) Fix the internal Sidebar “Support” badge logic (the red “1” in your screenshot)
**File:** `src/components/dashboard/Sidebar.tsx`

**Change:**
- Replace the current `openSupportCount` logic (counting `support_inquiries.status = 'open'`) with a `supportUnreadNotifCount` that counts **unread notifications** for the current user where `action_url` points to support:
  - internal: `/support/%`

**How the count will be computed:**
- Query `notifications`:
  - `user_id = currentUserId`
  - `read = false`
  - `action_url LIKE '/support/%'`

**Realtime updates:**
- Add a realtime channel subscription on `notifications` for the current user that listens to:
  - `INSERT` (new notification)
  - `UPDATE` (read status changed)
  - optionally `DELETE`
- On any of these events, re-fetch the unread support notification count.

**Result:**
- When you open `/support/:id`, after our existing 1s delay the app updates `notifications.read=true`.
- Sidebar subscription sees the UPDATE and the Support badge disappears immediately.

---

### 2) Make NotificationCenter react to “read” updates (so the bell badge clears without refresh)
**Files:**
- `src/components/notifications/NotificationCenter.tsx`
- (optional) `src/services/notificationService.ts` (if we keep subscription logic centralized)

**Problem today:**
- `NotificationCenter` fetches once, then subscribes only to `INSERT`.
- When we mark notifications as read elsewhere (like in `InquiryDetail` / `ClientSupportDetail`), the DB changes but the local React state doesn’t.

**Change:**
- Subscribe to `UPDATE` events for `notifications` (filtered to current user).
- In the `UPDATE` handler, patch the notification in local state:
  - if it exists: update its `read` value
  - if it doesn’t exist (rare edge case): ignore or re-fetch
- Optional: handle `DELETE` by removing from local state.

**Result:**
- Both Admin header and Client header bell badges update instantly when support notifications are marked read by page-view logic.

---

### 3) Make the client-side navigation reflect unread support items too (optional but matches “both sides”)
**File:** `src/components/client-portal/ClientSidebar.tsx`

Right now the client sidebar has no badge next to “Support”. If you want parity with the admin experience:

**Option A (recommended):**
- Show a small badge/dot next to “Support” when there are unread support notifications:
  - `notifications.read=false`
  - `action_url LIKE '/client/support/%'`

**Behavior when collapsed:**
- Show a dot overlay on the icon
**Behavior when expanded:**
- Show a small count badge or “dot” at the right.

This is optional because the client header already has the bell badge, but it matches your “both sides” requirement.

---

### 4) Harden `markSupportNotificationsAsRead` matching (small reliability improvement)
**File:** `src/services/supportReadService.ts`

Currently it matches exact URLs:
- `/support/{id}`
- `/client/support/{id}`

To be future-proof (if we ever add query params like `/support/{id}?from=notif`), we will switch to `LIKE` matching:
- `/support/{id}%`
- `/client/support/{id}%`

This ensures the “mark read” works even if action URLs evolve.

---

## Testing checklist (end-to-end)
1. Create a new support inquiry as client.
2. Log in as admin/agent:
   - Confirm Support badge shows “1” (unread notification).
   - Confirm bell badge shows “1”.
3. Click “View” to open the inquiry detail:
   - Wait ~1 second.
   - Confirm the bell badge decrements immediately.
   - Confirm the sidebar Support badge disappears immediately (without refresh).
4. Repeat for admin replying to client:
   - Client should see bell badge increment, then clear after opening `/client/support/:ticketId`.

---

## Files we’ll modify
- `src/components/dashboard/Sidebar.tsx` (change badge source to unread support notifications + realtime updates)
- `src/components/notifications/NotificationCenter.tsx` (listen to UPDATE events and sync local state)
- `src/components/client-portal/ClientSidebar.tsx` (optional: show unread support indicator)
- `src/services/supportReadService.ts` (use LIKE matching for marking support notifications read)

---

## Notes / tradeoffs
- Switching the sidebar badge from “open inquiries” to “unread support notifications” aligns with your expectation: it clears when you view the inquiry.
- If you still want “open inquiries count” somewhere, we can move that into the Support page tabs/header instead of the navigation badge (so it’s not mistaken for a notification indicator).
