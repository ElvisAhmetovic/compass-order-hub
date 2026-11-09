# Next step: test Stripe with play money, then go live

Stripe has a **test mode** (sandbox). It works exactly like live but uses fake cards, so no real money moves. We test there first, then switch back to the live keys.

## What you do in Stripe (about 5 minutes)
1. Turn on **Test mode / Sandbox** (top right in Stripe).
2. **Developers → API keys:** copy the test **Secret key** (starts with `sk_test_`).
3. **Developers → Webhooks → Add destination:** same URL and the same 6 events as before:
   `https://fjybmlugiqmiggsdrkiq.supabase.co/functions/v1/stripe-webhook`
   Copy its signing secret (`whsec_...`).
4. **Settings → Billing → Customer portal** in test mode: turn on Payment methods + Invoice history and save (test mode has its own settings).

## What I do
1. Open the secure form so you can paste the two test keys there. The live keys are replaced for the duration of the test.
2. Create one test package for **invoice@mediaamarketing.com** at **€1/month** with "Pay by Stripe subscription" turned on.
3. You pay from the email link with Stripe's fake card `4242 4242 4242 4242` (any future date, any CVC).
4. I check:
   - The package shows "Stripe: active", the month is marked paid, and a payment record exists.
   - The "Payment received" emails arrive (client + invoice inbox).
   - The client portal Invoices page shows the package, the payment, the receipt and the Manage payment method button.
5. Failed payment test: you switch the test card to `4000 0000 0000 0341` in the portal, and I trigger a renewal in Stripe test mode. I check that "Payment failed" shows and the retry email arrives.
6. Cancel test: cancel from the client portal and check "Cancels on [date]" and the emails.
7. Fix anything that breaks, then clean up: delete the test package and its records (only those, with your OK).
8. Go live: you paste the live secret key and the **live** webhook signing secret back through the secure form.
9. You publish, so the team and clients see the new buttons and the Invoices page.

## Technical details
- Secrets swapped via update_secret: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`. No code change needed for test mode.
- Renewal trigger: Stripe test clock or "advance" via the dashboard; the client portal is checked with a signed-in client session if one is available. Otherwise you take a screenshot of the client portal.
- Cleanup deletes only rows tied to the test contract id (monthly_contracts, monthly_installments, stripe_payments), listed for approval first.
