

## Order Created Notification + Portal Self-Service (Both Flows)

### Overview
Create a branded "Order Created" email (reusing the offer email template style) and a portal self-service credential request flow. This triggers from **two entry points**:
1. **Confirm Offer** (client confirms via email OR admin confirms for client)
2. **Create Order** (admin creates order directly, with "Send to client" toggled on)

### New Edge Functions

#### 1. `send-order-created-notification/index.ts`
- Reuses the exact HTML template from `send-offer-email` (5-star header, Google-style card, AB Media branding)
- Changes: headline → "Your order has been successfully created!", no "Confirm" action — informational only
- Shows: company name, client email, phone, price, description
- CTA button: "Go to Client Portal" → `https://empriatech.com/client/login?requestCredentials=ORDER_ID`
- Footer: same AB Media branding
- Input: `{ clientEmail, clientName, clientPhone, companyName, description, price, currency, orderId }`
- Uses `RESEND_API_KEY_ABMEDIA`, sends from `noreply@abm-team.com`

#### 2. `request-client-credentials/index.ts`
- Public endpoint (`verify_jwt = false`)
- Input: `{ orderId }`
- Steps:
  1. Fetch order by ID → get contact_email, company_name
  2. Check if `profiles` has a user with this email and role "client"
  3. If exists → generate new password, update via Admin API, send credentials via `send-client-portal-credentials`
  4. If not → create user via Admin API (role: client), link to order, bulk-link matching orders by email, send credentials
  5. Rate-limit: reject if credentials were sent for this order in the last 5 minutes (track via a simple timestamp check on order metadata or a dedicated field)

### Modified Files

#### `confirm-offer/index.ts`
- Capture the created order's ID from the insert (add `.select('id').single()`)
- After order creation, fire-and-forget call to `send-order-created-notification` with the order data

#### `src/components/dashboard/CreateOrderModal.tsx`
- Replace the current `ClientNotificationService.notifyClientStatusChange` call (lines 418-435) with a call to `send-order-created-notification` instead — this sends the branded email, not the generic status change email
- Only fires when `sendToClient` is toggled on

#### `src/pages/client/ClientLogin.tsx`
- Read `?requestCredentials=ORDER_ID` from URL
- If present, show a one-time `AlertDialog`: "Would you like us to send your login credentials to your email?"
- On confirm: call `request-client-credentials` edge function, show success toast, clear the query param
- On dismiss: just clear the param

#### `supabase/config.toml`
- Add `verify_jwt = false` for both new functions

### Flow Summary

```text
Admin creates order (toggle on)          Client/Admin confirms offer
         │                                         │
         ▼                                         ▼
  send-order-created-notification ◄── confirm-offer (captures orderId)
         │
         ▼
  Branded email arrives in client inbox
  Button: "Go to Client Portal"
         │
         ▼
  /client/login?requestCredentials=ORDER_ID
         │
         ▼
  One-time dialog: "Send my login info"
         │
         ▼
  request-client-credentials
  (creates/updates account, sends credentials email)
```

### Security
- `request-client-credentials` validates against a real order ID
- 5-minute rate limit prevents abuse
- No internal data (notes, priority, assigned person) in client email

