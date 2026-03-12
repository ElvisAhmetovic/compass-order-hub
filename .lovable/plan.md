

## Add "Send to Client" Toggle to Offer Confirmation

### Problem
Currently, when an admin clicks "Confirm for Client" on the Offers page, the `confirm-offer` edge function **always** sends the branded order notification to the client. This should be opt-in, consistent with how the CreateOrderModal works.

### Changes

#### 1. `src/pages/Offers.tsx`
- Add `sendToClientOnConfirm` state (boolean, default: false)
- Replace the `AlertDialog` for confirm with a `Dialog` containing:
  - The existing confirmation text
  - A Switch/toggle: "Send notification to client" (default off)
  - Confirm & Cancel buttons
- Pass `sendToClient` boolean to the edge function call: `body: { offerId, sendToClient }`
- Reset `sendToClientOnConfirm` when dialog closes

#### 2. `supabase/functions/confirm-offer/index.ts`
- Read `sendToClient` from the request body (default: `true` to preserve behavior when client confirms via public link)
- Wrap the `send-order-created-notification` fire-and-forget block (lines 132-151) in `if (sendToClient)`
- When called from the public confirmation page (no `sendToClient` param), it defaults to `true` (client clicked confirm themselves, so they should get the email)
- When called from admin "Confirm for Client", the frontend passes the toggle value

### Logic
```text
Public confirm page → sendToClient defaults to true (client confirmed themselves)
Admin "Confirm for Client" → sendToClient comes from toggle (default off)
```

Team notifications always fire regardless.

