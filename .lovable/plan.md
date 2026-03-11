

## Send Team Notification on Offer Confirmation

### What
After the `confirm-offer` edge function creates the order from a confirmed offer, it should also call the existing `send-order-confirmation` edge function to notify the team — same as when an order is created normally via the dashboard.

### Changes

**`supabase/functions/confirm-offer/index.ts`**
After the order is successfully inserted (line 80), add a fetch call to the `send-order-confirmation` edge function with:
- `orderData`: the newly created order data (company_name, contact_email, price, currency, status, priority, description, internal_notes, etc.)
- `emails`: the hardcoded team notification list (same 12 emails from `notificationEmails.ts`)
- `assignedToName`: `offer.sent_by_name`
- `selectedInventoryItems`: `orderData.inventoryItems || []`

This is a fire-and-forget call within the same edge function — no need to await success since the order creation is already complete. The call uses the Supabase URL + anon key to invoke the sibling function directly via fetch.

### File Summary
- **Modified**: `supabase/functions/confirm-offer/index.ts` — add team email notification after order creation

