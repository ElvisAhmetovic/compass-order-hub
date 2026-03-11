

## Resend Offer: Add "Send Again" Button to Offer View Dialog

### What
Add a "Send Again" button in the View Offer dialog. When clicked, it:
1. Creates a **new** offer record in the DB (with fresh `id` and `created_at`)
2. Sends the offer email with the new offer's confirmation link
3. Deletes the **old** offer record
4. Refreshes the list and shows success toast

This gives the client a fresh email with a new valid confirmation link, replacing the old (possibly spam-filtered) one.

### Changes

**`src/pages/Offers.tsx`**
- Add `resendingOffer` state (string | null) to track which offer is being resent
- Add `handleResend(offer)` function that:
  1. Inserts a new offer row with same data (client_name, client_email, client_phone, client_address, company_name, description, price, currency, sent_by, sent_by_name, order_data, status='sent')
  2. Calls `send-offer-email` edge function with the **new** offer's `id`
  3. Deletes the old offer by its `id`
  4. Calls `fetchOffers()` to refresh
- Add a "Send Again" button (with `Send` icon) in the View Offer dialog footer, next to the status badge
- Show loading state while resending
- Include `sent_by` and `order_data` in the Offer interface

### Technical Detail
- The offer interface needs `sent_by` (uuid) and `order_data` (any/object) fields added
- The resend creates a brand new DB row so the confirmation link (`/confirm-offer/:newOfferId`) is fresh and the old expired one no longer works

