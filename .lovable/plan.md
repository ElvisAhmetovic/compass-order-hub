

## Confirm Offer Flow: Client Clicks "Confirm" → Auto-Creates Order

### Overview
When a client clicks "Confirm Your Order" in the offer email, they land on a public page (`/confirm-offer/:offerId`) showing the offer details. When they click "Confirm", a Supabase Edge Function converts the offer into an order in the dashboard and updates the offer status. The client sees a thank-you message and is redirected away.

### Changes

**1. Database: Add `confirmed_at` column to `offers` table + UPDATE RLS policy**
- Add `confirmed_at timestamptz` column (nullable) to track confirmation
- Add UPDATE RLS policy allowing anon users to update offers (for the edge function using service role)

**2. New Edge Function: `confirm-offer`**
- Accepts `offerId` in the request body
- Uses Supabase service role client to:
  1. Fetch the offer by ID
  2. Check it hasn't already been confirmed (`confirmed_at IS NULL`)
  3. Insert a new order into the `orders` table using the offer's stored data (`company_name`, `contact_email`, `contact_phone`, `company_address`, `price`, `currency`, `description`, plus `order_data` JSON for `company_link`, `priority`, `internal_notes`)
  4. Update the offer: set `status = 'confirmed'`, `confirmed_at = now()`
  5. Return success
- `verify_jwt = false` since clients are unauthenticated

**3. New Page: `src/pages/ConfirmOffer.tsx`**
- Public page at `/confirm-offer/:offerId`
- On mount: fetches offer details via the edge function (or a lightweight read — but since RLS blocks anon, the edge function will handle everything)
- Shows: AB Media Team branding, client name, company, price, description — same info card as the email
- "Confirm Your Order with AB Media Team" button
- On click: calls `confirm-offer` edge function
- On success: shows "Thank you for confirming! We will contact you shortly via WhatsApp or email." with a checkmark, then after 5 seconds redirects to `https://gmail.com`
- If already confirmed: shows "This offer has already been confirmed"

**4. Update `send-offer-email` Edge Function**
- Change the "Confirm Your Order" button href from the placeholder `https://compass-order-hub.lovable.app` to `https://empriatech.com/confirm-offer/${offerId}`
- This means the edge function needs to receive the `offerId` — so it must be passed from the frontend after the offer is inserted into the DB

**5. Update `CreateOrderModal.tsx`**
- Reorder the send-offer flow: first INSERT the offer into DB to get the `offerId`, then pass `offerId` to the `send-offer-email` edge function so the confirmation link includes it

**6. Update `src/App.tsx`**
- Add route: `<Route path="/confirm-offer/:offerId" element={<ConfirmOffer />} />`

**7. Update `supabase/config.toml`**
- Add `[functions.confirm-offer]` with `verify_jwt = false`

### File Summary
- **New**: `src/pages/ConfirmOffer.tsx`, `supabase/functions/confirm-offer/index.ts`
- **Modified**: `src/App.tsx`, `src/components/dashboard/CreateOrderModal.tsx`, `supabase/functions/send-offer-email/index.ts`, `supabase/config.toml`
- **Migration**: Add `confirmed_at` column to `offers`

