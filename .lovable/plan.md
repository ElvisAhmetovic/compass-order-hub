

## Add "Confirm for Client" Button on Offers Page

### What
Add a button on each offer row (and in the detail dialog) that lets an admin manually confirm an offer on behalf of the client (e.g., when the client confirmed via phone call). This reuses the existing `confirm-offer` edge function which already handles order creation + team notifications.

### Changes

**File: `src/pages/Offers.tsx`**

1. Add a new `CheckCircle2` icon import from lucide-react
2. Add state: `confirmingOffer` (string | null) to track which offer is being confirmed
3. Add `handleConfirmForClient` function:
   - Show a confirmation alert dialog first ("Are you sure? This will create an order.")
   - Call `supabase.functions.invoke('confirm-offer', { body: { offerId } })`
   - Handle `alreadyConfirmed` response
   - Show success/error toast
   - Refresh offers list
4. Add a new `AlertDialog` for confirm-for-client confirmation (similar to delete dialog)
5. Add the "Confirm for Client" button in two places:
   - **Table row actions**: A green-tinted button with CheckCircle2 icon next to View/Delete (only shown when offer status is not "confirmed")
   - **Detail dialog**: Next to the "Send Again" button (only when not already confirmed)

### No backend changes needed
The existing `confirm-offer` edge function already does everything: creates the order, sends team notifications, and marks the offer as confirmed.

