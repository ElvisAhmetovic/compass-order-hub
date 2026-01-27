
# Remove Internal Team Features from Client View

## Overview

This plan ensures that internal team features (Activity Log, Team Encouragement messages, and Team Chat) are never visible to client users. While the routing already redirects clients to their portal, this adds an extra layer of protection.

## Changes Required

### 1. Dashboard.tsx - Hide Activity Log Button

The Activity Log button in the dashboard header should only be visible to admin, agent, and user roles - not clients.

**Current code (lines 246-271):**
```tsx
{/* Activity Log Toggle Button */}
<Button variant="outline" size="sm" ...>
  <Clock className="h-4 w-4 mr-2" />
  Activity Log
  ...
</Button>
```

**Change:** Wrap the button in a role check:
```tsx
{userRole !== 'client' && (
  <Button variant="outline" size="sm" ...>
    <Clock className="h-4 w-4 mr-2" />
    Activity Log
    ...
  </Button>
)}
```

---

### 2. Dashboard.tsx - Hide Team Encouragement Messages

The encouraging team messages are internal morale boosters and shouldn't appear in client views.

**Current code (lines 274-277):**
```tsx
{isDashboardHome && (
  <TeamEncouragement />
)}
```

**Change:** Add role check:
```tsx
{isDashboardHome && userRole !== 'client' && (
  <TeamEncouragement />
)}
```

---

### 3. Sidebar.tsx - Remove Team Chat from Client View

The Team Chat sidebar item currently includes `user` in its roles array. Since the `client` role is not listed, it should already be hidden. However, for absolute clarity and safety, we should explicitly exclude client from seeing it.

**Current code (lines 71-76):**
```tsx
{
  href: "/team-collaboration",
  icon: MessageSquare,
  label: "Team Chat",
  roles: ["admin", "agent", "user"]
}
```

This is already correct - `client` is not in the roles array, so clients won't see this item. No change needed here.

---

## Summary of File Changes

| File | Change |
|------|--------|
| `src/pages/Dashboard.tsx` | Wrap Activity Log button in `userRole !== 'client'` check |
| `src/pages/Dashboard.tsx` | Add `userRole !== 'client'` to TeamEncouragement condition |
| `src/components/dashboard/Sidebar.tsx` | No change needed (already excludes client role) |

---

## Why This Works

1. **Primary protection**: `RequireAuth` redirects client users from `/dashboard` to `/client/dashboard`
2. **Secondary protection**: Even if a client somehow accesses the admin dashboard, these internal features remain hidden
3. **Clean separation**: Client Portal uses its own `ClientSidebar` which has only client-appropriate navigation items

## Result

After these changes, clients will never see:
- The Activity Log button (internal team feature)
- Team Encouragement messages (internal morale feature)
- Team Chat in the sidebar (already hidden, but verified)
