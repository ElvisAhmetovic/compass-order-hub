## Answer: yes, it updates automatically

It doesn't matter where the client opens the link (WhatsApp, email, portal). Stripe tells our system when the payment goes through, and the system then:

- marks the order **Invoice paid**
- marks any open invoice for that order **Paid**
- marks the payment link as paid, so it leaves "Open payments" in the client portal and shows up in their payment history
- emails a confirmation to the client and to the invoice inbox

If the client pays an old link that was already replaced, nothing is marked paid automatically. Instead the invoice inbox gets an email asking someone to check it by hand.

## What is not verified yet
No real payment has gone through this path yet, because that would charge live money. The only way to confirm it safely is Stripe test mode.

## Proposed next step (only if you want it)
1. You create Stripe test keys and a test webhook (steps from my earlier message), then reply "test keys ready".
2. I connect them only for the test client.
3. I create a payment link on the test order, open it outside the site, and pay with the fake card 4242 4242 4242 4242.
4. I check that the order, the invoice, the portal and both emails all update, then tell you the results.

No code changes are needed for the automatic update itself.
