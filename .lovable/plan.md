

## Add Custom Message Input When Toggling Order Statuses

### What Already Works

The backend is fully ready:
- `ClientNotificationService` interface already has an optional `customMessage` field
- The `send-client-status-notification` edge function already renders custom messages in a styled blue box in the email
- The `send-service-delivered-notification` function fires separately for "Resolved"

The only missing piece is the **UI** -- there's no way for team members to type a message before confirming a status change.

### Solution

Create a small confirmation dialog that appears when a status is toggled. It shows the status being changed and an optional textarea for a personalized note. The message gets threaded through `toggleOrderStatus` to the client notification email.

### Changes

**1. New Component: `StatusChangeDialog.tsx`**

A simple Dialog with:
- Title: "Add Resolved" / "Remove Complaint" (dynamic)
- Optional textarea: "Add a message for the client (optional)"
- Placeholder: e.g. "Your complaint has been resolved and the review has been removed."
- Two buttons: "Skip Message & Confirm" and "Send with Message"
- Both confirm the status change; the second passes the custom message

**2. Modify `OrderService.toggleOrderStatus`**

Add an optional 4th parameter `customMessage?: string`. Pass it through to the `ClientNotificationService.notifyClientStatusChange` call (line 681) and the `send-service-delivered-notification` invocation (line 699). No other logic changes.

**3. Modify `MultiStatusBadges.tsx`**

Instead of calling `OrderService.toggleOrderStatus` directly from the checkbox handler, open the new `StatusChangeDialog` first. On confirm, call `toggleOrderStatus` with the optional message.

**4. Modify `OrderActions.tsx`**

Same change for the status toggle menu items in the admin dropdown -- open the dialog instead of calling directly.

### Files

| File | Action |
|------|--------|
| `src/components/dashboard/StatusChangeDialog.tsx` | **Create** -- confirmation dialog with optional message textarea |
| `src/services/orderService.ts` | **Modify** -- add `customMessage` param to `toggleOrderStatus`, pass to notifications |
| `src/components/dashboard/MultiStatusBadges.tsx` | **Modify** -- use dialog before toggling |
| `src/components/dashboard/OrderActions.tsx` | **Modify** -- use dialog before toggling |

### User Experience

1. Admin clicks a status checkbox (e.g. "Resolved") in the dropdown or badge area
2. A small dialog appears: **"Add status: Resolved"** with a textarea
3. They can type "Your issue has been resolved, the negative review has been removed" or leave it blank
4. Click confirm -- status updates and the client email includes their personalized note in a styled message box

The dialog is lightweight and doesn't block workflow -- the "Skip" button is prominent so it's one extra click when no message is needed.
