

## Send Status Change Notifications to `contact_email` (Not Just Portal Users)

### Problem

Currently, the client status notification (`send-client-status-notification`) only works for orders with a linked `client_id` (portal users). If a client doesn't have a portal account but the order has a `contact_email`, they get nothing.

### Solution

Two changes:

**1. Frontend: Remove the `client_id` gate in `orderService.ts`**

Currently (line 671): `if (enabled && currentOrder.client_id)` -- this blocks the notification for orders without a portal client. Change to also fire when `contact_email` exists:

```
if (enabled && (currentOrder.client_id || currentOrder.contact_email))
```

**2. Edge Function: `send-client-status-notification/index.ts`**

Currently the function bails out at line 137 if there's no `client_id`. Instead, add a fallback path:

- If `client_id` exists: use the current flow (fetch profile name + app_users email)
- If no `client_id` but order has `contact_email`: use `contact_email` as recipient and `company_name` / company `contact_person` as the client name
- Only bail if neither exists

This keeps the existing portal flow intact while adding support for non-portal clients.

### Files to Modify

| File | Change |
|------|--------|
| `src/services/orderService.ts` | Line 671: expand condition to include `contact_email` |
| `supabase/functions/send-client-status-notification/index.ts` | Add fallback to `contact_email` when no `client_id`, use company contact person as name |

### What Stays the Same

- The "Service Delivered" email for Resolved status (already sends to `contact_email`)
- The team notification (unchanged)
- The email template HTML (same for both paths)
- The custom message support (works for both paths)
- The 30-second throttle (works for both paths)

