# Monthly packages: Stripe like orders, plus clear payment tracking

## Answers to your questions (how it works today)

- **Does the system know the client paid?** Yes. Every time Stripe charges the client, our system gets a signed message from Stripe and marks that month's installment **paid** in Monthly Packages, with the date it was paid. If a charge fails, the package shows **Payment failed**.
- **Does a 12-month package stop after 12 payments?** **No, not today.** The Stripe subscription keeps charging every month until someone cancels it. This needs fixing (see item 2).
- **Is the paid date shown with Stripe info?** Partly. We already save each Stripe payment (amount, date, period, receipt/PDF link), but the team can't see it in Monthly Packages. Only the client portal shows it (see item 3).
- **Save and copy without email?** Not today. The monthly Stripe button only "sends" (email + copies). The link also expires after 24 hours.

## What to build

1. **Same Stripe dialog as orders**
  - Edit product name, description; see the price with VAT.
  - Buttons: **Save link** (no email), **Send to client by email**, **Copy for WhatsApp**.
  - Show the current link with its status (waiting / paid / expired) and a **New link** button if it expired.
2. **Stop after the package length**
  - When a package has a length (e.g. 12 months), the Stripe subscription is set to end automatically after that many payments. The client is never charged a 13th time.
  - Packages with no length keep running until cancelled.
  - The badge shows "Ends 12.11.2027" so the team sees it.
3. **Stripe payments visible to the team**
  - In each package's installment list: status **Paid** with the paid date, amount, card/payment type (e.g. "Visa •••• 4242"), Stripe receipt link and invoice PDF.
  - A progress line like "4 of 12 paid", next charge date, and failed attempts with the reason Stripe gave.
4. **Tests** for the end-date rule (12 months monthly = 12 charges; quarterly 12 months = 4 charges) and the paid-status mapping.

## Question for you

After the last payment of a 12-month package, should it just **end**, or do you want a reminder email to the team to offer a renewal? (Default: it ends and the team gets a short email.)  
  
  
definitely offer renewal, also alongside these things we should also implement a way that if a client fails to pay that monthly stripe subscription that we get notified they didnt pay 

## Technical details

- `stripe-billing`: new actions `save_contract_link` / `send_contract_link` mirroring order links; `createCheckout` sets `subscription_data.metadata` plus, after `checkout.session.completed`, the webhook sets `cancel_at` = start + duration_months on the subscription (Checkout cannot set cancel_at directly). Rule in `_shared/stripeRules.ts` with Deno tests.
- Webhook `invoice.paid`: also store payment method brand/last4 and `hosted_invoice_url` on `stripe_payments` (migration adds nullable columns), and `last_payment_error` on failure.
- UI: refactor `StripeLinkDialog` to the OrderStripeLinkDialog pattern; installment list reads `stripe_payments` by `contract_id` (team RLS read).
- Testing a real charge still needs Stripe test mode ("test keys ready").