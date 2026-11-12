# Stripe audit: gaps, risks and QA plan

## What already works
- Order payment links and monthly subscriptions created only by the team, with a signed webhook and protection against processing the same event twice.
- Paid, failed, cancelled and ended subscriptions update orders, invoices, Monthly Packages and the client portal, and send emails and alerts.

## Gaps found (the webhook doesn't handle these Stripe events yet)
1. **Refunds** (`charge.refunded`): a refunded payment stays "Paid" in the invoice, order and portal. Fix: mark it refunded or partly refunded, update the invoice status, and alert the team.
2. **Disputes / chargebacks** (`charge.dispute.created/closed`): no alert today. Fix: an urgent email and bell alert, and a "Disputed" flag on the payment.
3. **Delayed payment methods** (SEPA debit, bank redirects): `checkout.session.completed` can arrive before the money has cleared. Fix: mark it paid only when `payment_status = paid`, and handle `async_payment_succeeded` / `async_payment_failed`.
4. **Expired checkout** (`checkout.session.expired`): the link shows as expired only after we work it out ourselves. Fix: record the expiry so the team sees "Expired" right away.
5. **Card expiring / action needed** (`invoice.payment_action_required`, 3-D Secure): the client gets no prompt. Fix: send the client an email with Stripe's hosted invoice link.
6. **Webhook health**: no alert if Stripe stops reaching us. Fix: a daily check that warns the team when no events have arrived in 7 days while active subscriptions exist, plus a list of failed events.

## Things to watch out for (no code needed)
- Turn on the matching events in the Stripe dashboard webhook settings once the gaps above are built.
- Live keys are in use: until test mode exists, every QA payment is real money.
- Packages created before today keep charging until someone cancels them.
- VAT: confirm the Stripe price matches the invoice amount including VAT.

## QA plan (run once test mode keys are added)
Given test keys are set, when a test card is used:
- Order link paid → order, invoice and portal show Paid, and the thank-you page appears.
- Monthly subscription → the first month is Paid with the card label, and "1 of N paid".
- Declined card `4000 0000 0000 0341` → failure email and bell alert, and the client gets a retry link.
- 3-D Secure card `4000 0027 6000 3184` → the client gets an action-needed email.
- Refund in the dashboard → the status changes to Refunded.
- Dispute test card `4000 0000 0000 0259` → dispute alert.
- Cancel and resume from the team side and from the portal.
- Webhook replay of the same event → nothing is duplicated.

## Technical details
- Add a test-mode switch to `_shared/stripeApi.ts`: `STRIPE_TEST_SECRET_KEY` / `STRIPE_TEST_WEBHOOK_SECRET`.
- Migration: add `refunded_amount`, `refunded_at` and `dispute_status` to `stripe_payments`, plus `stripe_checkout_expired_at` on contracts and order links.
- Add the new cases to the `stripe-webhook` switch, with pure helpers in `stripeRules.ts` and Deno tests (refund status, async paid check).
- Show the new states in `StripePaymentsPanel`, the order payment section and the portal Invoices page.
