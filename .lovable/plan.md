# Offers that turn into monthly packages

Good idea, as long as it's opt-in per offer. Today an accepted offer already creates an order and a portal invite. What's missing is the monthly package and its Stripe link.

## Behaviour (Given/When/Then)
- Given the team creates an offer and turns on "This is a monthly package", they enter a monthly price, billing (monthly/quarterly/yearly), duration in months, start date, and optionally "Pay by Stripe subscription" plus the Stripe product name.
- When the client accepts that offer, then the system creates the order (as today), creates the monthly package linked to that order, and creates the portal account if the client doesn't have one (as today).
- And if Stripe is on, the client gets one email with the Stripe subscribe link. If Stripe is off, the package follows the normal bank-transfer invoices.
- Given an offer without the switch, then nothing changes.
- Given the client accepts the same offer twice (double click or refresh), then only one package is created and one Stripe email is sent.
- The team gets a notification: "Offer accepted – monthly package created for X".

## What changes
1. Offer form: "This is a monthly package" switch with the package fields (reusing the same fields as the package form).
2. Offer page for the client: shows "€X per month, N months" instead of a one-off price when it's a package.
3. Accepting the offer: creates the package and, if chosen, sends the Stripe link automatically.
4. Package list: a small "From offer" tag that links back to the offer.

## Technical details
- Package terms stored in `offers.order_data.monthly_package` (no new offer columns). Add `monthly_contracts.offer_id` (unique, so accepting twice can't create two packages).
- `confirm-offer`: after the order insert, insert `monthly_contracts` (service role), then call `stripe-billing` with a new server-only action `create_link_internal` (service-role token only) that reuses the existing link and email code.
- Rule tests: package terms validation, a second accept creates no second package, Stripe off means no Stripe call. 401 test for the internal action.
- Gate A checks. No live emails or Stripe links in testing, except to an internal address with your OK.
