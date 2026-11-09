## Client portal: fixes and improvements

### 1. Urgent: passwords are emailed to admins
When a client changes their password in Settings, the new password is included in a notification email to two admin addresses. Fix: the email only says "Client X changed their password", never the password itself.

### 2. Clients should always see the same orders everywhere
Different parts of the portal decide which orders belong to a client in different ways, so an order can show up under Payments but fail to open, or be missing from the Support order picker. Fix: one shared rule (client record, portal user, or contact email) used by the order list, order detail, support, live updates and billing.

### 3. Don't show "nothing owed" when loading fails
If billing data fails to load, the portal currently shows empty lists, which looks like the client owes nothing. Fix: show a clear "Couldn't load, try again" message with a Retry button on the Dashboard, Invoices, Order detail and Support pages.

### 4. Dashboard: show what needs paying
Add a small "Open payments" card (amount + Pay now) and the monthly package status (active / payment failed / cancelling) to the dashboard.

### 5. Order page: show payments for that order
On each order, show its open Stripe payment link (Pay now), its invoices and its payment history.

### 6. Invoice PDF downloads
Add a "Download PDF" button for Stripe invoices in the payment history.

### 7. Full German / English
Translate what is still English-only: the login page, order status names and timeline, notifications and the live-update pop-up. Show dates and prices in the client's chosen language.

### 8. Speed and small fixes
- Dashboard loads all orders twice; load only counts and the last 5.
- Live updates reconnect constantly and miss brand-new orders; fix both.
- Changing language says "saved" even if saving failed; show the real result.
- Long links and the notifications pop-up overflow on small phones; fix wrapping and width.

### Already fine
Password rules (8+ characters, upper, lower, number) and the back buttons work correctly.

### Technical details
- `notify-password-change`: remove `newPassword` from the request body and the email; ClientSettings stops sending it.
- New `src/services/clientOwnership.ts` builds the `client_id / client_user_id / contact_email` OR filter; use it in clientOrderService, clientSupportService, useClientOrdersRealtime; stripe-billing overview adds `client_user_id` and throws on query `.error`.
- stripe-billing `overview` accepts an optional `order_id` for order-scoped data; the dashboard reuses `overview`.
- Callback ref in useClientOrdersRealtime and also listen for INSERT.
- New translation keys in clientTranslations (EN/DE); clientStatusTranslator reads the active language.
- Tests: ownership filter builder, password email payload contains no password, billing overview error path. Verify with Playwright as the test client (invoice+portaltest).
