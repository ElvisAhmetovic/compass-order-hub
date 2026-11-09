# Payment confirmation page

Today, after paying, Stripe sends the client to the portal's Invoices page. A client who paid from WhatsApp or email and isn't signed in hits the login screen instead of a "thank you". This adds a public confirmation page that works without signing in.

## What the client sees
Page at `www.empriatech.com/payment/thank-you`, in German or English (switch, German default):
- A large "Payment received" check mark, or "Confirming your payment…" while Stripe's confirmation is still on the way (the page checks again by itself for about 30 seconds).
- **Payment details:** what was paid (order or package name), amount (e.g. 399,99 €), date, payment reference, and the invoice number when there is one.
- **Next steps:**
  - "A confirmation email is on its way."
  - For an order: "Our team has been notified and will continue with your order."
  - For a monthly package: "Your package is active. The next charge is on [date]."
  - "Questions? invoice@mediaamarketing.com / +49 203 7090 1754"
- Buttons: **Open client portal** (goes to login if signed out) and **Download receipt** (Stripe receipt, when available).
- If the link is wrong or old: a friendly "We couldn't find this payment" note with contact details. No personal data shown.

## Privacy
The page shows only a summary of that single payment. It is found by Stripe's one-time checkout reference in the link, and shows no address, no other invoices and no account data.

## Which payments use it
- New Stripe links on orders and new package checkouts.
- Existing open order links are switched over automatically, so links already sent on WhatsApp also land here.
- Not covered: Stripe links the team pasted into invoices by hand, because those are set up in Stripe itself.

## Technical details
- `stripe-billing`: success/redirect URLs become `${APP_URL}/payment/thank-you?session_id={CHECKOUT_SESSION_ID}`. A new public action, `receipt`, takes a `session_id` matching `cs_…` and fetches the session from Stripe. It returns only: kind (order/package), title, amount, currency, paid flag, date, invoice number, receipt URL and the next charge date. `paid` is true when the Stripe session is paid, so the page doesn't wait on the webhook. There is no auth, but input is validated and the response is minimal. 404 if not found.
- A one-off backfill updates `after_completion` on active Stripe Payment Links from `order_payment_links` (status pending).
- New route `/payment/thank-you`, kept outside the CRM and portal guards, with `noindex`.
- Pure helper `receiptView(data)` that picks the state and next steps, plus a vitest. A Deno test for session_id validation.
- Verify: curl `receipt` with a bad ID returns 404 and leaks nothing. Use Playwright to check the not-found and "confirming" states. A real paid state needs Stripe test mode, which is still waiting on "test keys ready".
