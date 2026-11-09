# Stripe subscriptions for monthly packages + client billing area

## What I found today
- Stripe is only a payment link your team pastes in by hand on an invoice. Nothing is connected to Stripe, and nothing updates when a client pays.
- The client portal's **Invoices** page is an empty "coming soon" placeholder.
- Monthly packages link to clients by **email only** (no direct link to the client record). The monthly run creates the installment, the invoice and the email.
- Your backend is your own Supabase server, so we'll connect **your existing Stripe account** with its secret key. Lovable's built-in payments can't be used here.

## Expected behavior (Given / When / Then)

**Creating a package with Stripe**
- Given a team member creates a monthly package and ticks "Pay by Stripe subscription"
- When they save
- Then a Stripe customer and subscription checkout is prepared with the package price and interval (monthly, quarterly, yearly)
- And the order and first invoice are created as they are today, with a "Subscribe & pay" link
- And the client gets the invoice email with that button, plus the bank details as before (both options stay)

**Client subscribes**
- Given a client opens the link from the email or the portal
- When they finish paying on Stripe's secure page
- Then the package shows "Stripe: active" in the CRM, the invoice becomes **Paid** with the date, and a payment record is saved
- And the team gets a notification and the client gets a payment confirmation

**Later months**
- Given an active subscription
- When Stripe charges the card each period
- Then the matching invoice is marked Paid automatically, with no duplicate invoice
- When a charge fails, the invoice stays open, the client is notified with a retry link, and the team sees "Payment failed"

**Client portal**
- Given a signed-in client
- When they open **Invoices & Billing**
- Then they see their own packages only: amount, interval, status (active, cancelled, payment failed), next charge date
- And invoice history with PDF download and a **Pay now** button on anything unpaid
- And payment history (date, amount, Stripe or bank transfer)
- And each item links to its order

**Cancelling (client or team)**
- Given an active subscription
- When the client clicks Cancel in the portal (after a confirmation) or a team member clicks Cancel in the CRM
- Then it stops at the end of the paid period, shows "Cancels on [date]" everywhere, and the package is stopped then
- And both sides get a notification
- A client can never see or cancel someone else's package

**Safety**
- No Stripe secret ever reaches the browser
- Payment status is changed only by verified Stripe messages, never by the browser
- Bank-transfer invoices keep working exactly as now

## Build order
1. Connect Stripe (you'll paste the secret key and later a webhook signing secret into a secure form).
2. Database: Stripe IDs and status on packages, a payments history table, client access rules (forward migration file).
3. Server functions: create subscription checkout, receive Stripe webhooks, cancel subscription, and a Stripe billing portal link for card updates.
4. CRM: a Stripe option when creating a package, a status badge, a Cancel button and the payment history on the package and order.
5. Monthly run: for Stripe packages, the invoice gets a pay link and is marked paid from Stripe, with no double billing.
6. Client portal: build the Invoices & Billing page (English/German, plus the portal's other languages).
7. Emails: the invoice email gets a Subscribe/Pay button; add payment-confirmation, failed-payment and cancellation emails, sent from `noreply@mediaamarketing.com`.

## Testing (per your rules)
- Unit tests: interval-to-Stripe mapping, webhook event to invoice status, duplicate-event handling, cancel rules, and clients only seeing their own data.
- Every new server function returns 401 to strangers. Webhooks with a bad signature are rejected.
- A full run in **Stripe test mode** with a test card: subscribe, paid, renewal, failed card, cancel. No real money, and no real clients' data touched.
- Live data stays read-only unless you approve a specific change.

## Things to confirm before going live
- Existing packages stay on bank transfer unless you switch them one by one. Nothing is moved automatically.
- Stripe fees and VAT/tax settings live in your Stripe account. I won't change them.

## Technical details
- Secrets: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.
- New columns on `monthly_contracts`: `payment_method`, `stripe_customer_id`, `stripe_subscription_id`, `stripe_status`, `current_period_end`, `cancel_at`.
- New `payments_stripe` (or extend `payments`) table: invoice_id, contract_id, amount, currency, stripe ids, status, paid_at.
- RLS: clients read only the rows where the contract or invoice email matches their `clients.email`, or the client_id is theirs.
- Edge functions:
  - `stripe-create-subscription` (team JWT): Checkout Session in subscription mode, price created from the contract amount and `billing_frequency`.
  - `stripe-webhook` (verify_jwt false, signature verified): handles `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated/deleted`. Idempotent by event ID.
  - `stripe-cancel-subscription` (team or owning client): `cancel_at_period_end`.
  - `stripe-billing-portal` (owning client).
- `generate-monthly-installments`: Stripe-paid packages skip bank-only reminders and link the invoice to the Stripe invoice. Bank accounts stay consistent with the existing rule.
- Client portal: replace `ClientInvoices.tsx` with the real page, using translations in the client language context.
