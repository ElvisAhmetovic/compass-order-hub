

## Make Client Notifications Opt-In (Not Automatic)

### Problem
Currently, client notifications are sent automatically in two places:
1. **Order creation** (`CreateOrderModal.tsx`): Only sends to team — no client notification exists here yet, so this is fine
2. **Status changes** (`orderService.ts` → `toggleOrderStatus`): Automatically sends to client AND sends "Service Delivered" email when Resolved is toggled — no way to opt out

The StatusChangeDialog currently says "The client will be notified" with no option to prevent it.

### Template Audit
- **Team email** (`send-order-confirmation`): Contains internal notes, priority, assigned person, inventory items — appropriate for team only. **Not sent to clients currently.**
- **Client status email** (`send-client-status-notification`): Shows company name, old→new status, optional custom message, portal/ticket links. **No internal info leaked — looks clean.**
- **Service Delivered email** (`send-service-delivered-notification`): Professional client-facing email. **Clean.**
- **Team status change email** (`send-status-change-notification`): Contains internal notes, price, assigned person. **Team only — appropriate.**

### Changes

#### 1. `src/components/dashboard/StatusChangeDialog.tsx`
- Add a `sendToClient` checkbox/switch (default: **off**)
- Pass `sendToClient` boolean back to `onConfirm` callback
- Update description text: instead of "The client will be notified", show the toggle
- Only show custom message textarea when `sendToClient` is checked

#### 2. `src/components/dashboard/MultiStatusBadges.tsx`
- Update `handleConfirm` signature to accept `sendToClient` boolean
- Pass `sendToClient` to `OrderService.toggleOrderStatus`

#### 3. `src/services/orderService.ts` → `toggleOrderStatus`
- Add `sendToClient?: boolean` parameter (default `false`)
- Wrap the client notification block (lines 670-703) in `if (sendToClient)` check
- Wrap the "Service Delivered" block (lines 705-722) in `if (sendToClient)` check
- Team notifications remain always-on (unchanged)

#### 4. `src/components/dashboard/CreateOrderModal.tsx`
- Add a "Send notification to client" switch (default: **off**)
- When enabled and order is created, call `ClientNotificationService.notifyClientStatusChange` with status "Created"
- Team notification emails remain always-on (unchanged)

### Summary
- Team always gets notified (no change)
- Client notifications become opt-in via a toggle in both the Create Order modal and the Status Change dialog
- No internal/sensitive data is leaked in client-facing templates (verified)

