# Stripe one-time payment links on normal orders

## Behaviour (Given/When/Then)
- Given a normal order, then the order row has a **Stripe** button where the "→ Yearly" button is now. "Move to yearly" stays available in the order's ⋯ menu, so nothing is lost.
- When the team clicks **Stripe**, a window opens with:
  - **Title** (shown on the Stripe page, the receipt and the email; defaults to company name and order)
  - **Description** (optional)
  - **Net price**, a **VAT** switch and rate (default 19%), and the total with VAT worked out (e.g. €399,99 + 19% = €475,99)
  - **Currency** (EUR)
- When they press **Save**, then a Stripe payment link is created and saved on the order. Reopening the window shows it, with **Copy link** (for WhatsApp), **Send to client by email** and **Open**.
- When they change the price or title and save again, then the old link stops working and a new one replaces it, so the client can't pay the old amount.
- When **Send to client** is pressed, then the client gets a German + English email with the title, the amount and a "Pay now" button, plus the portal line.
- Given the client is signed in to the portal, then under **Invoices**, "Open payments" shows the title, the amount and a **Pay now** button. After paying, it moves to "Payment history" as Paid.
- When the client pays, then the order is marked **Invoice paid**, the linked invoice (if any) becomes Paid, a payment record is saved, and the team gets the "Stripe payment received" email. A double notification from Stripe is ignored.
- Only the team can create, change or send links. A client only sees their own.
- Bank transfer details on invoices stay as they are.

## What changes
1. New Stripe payment window on the order row (replacing the Yearly button).
2. Stripe creates the link from the title, description and amount with VAT.
3. Email to the client, and a copy button for WhatsApp.
4. The client portal Invoices page gets an "Open payments" list and payment history entries.
5. When a payment arrives, the order and invoice are marked paid automatically.

## Technical details
- Migration: new table `order_payment_links` (order_id, title, description, net_amount, vat_enabled, vat_rate, total_amount, currency, stripe_link_id, url, status pending/paid/replaced, paid_at, created_by). Team gets full access through user_roles; clients can only read rows for their own orders (orders.client_id or contact_email). Includes GRANTs and RLS.
- `stripe-billing`: new team-only actions `create_order_link` (Stripe Payment Links API with a one-time price, metadata order_id + link_id; deactivates the previous link) and `send_order_link`. `overview` also returns the client's order payment links.
- `stripe-webhook`: on `checkout.session.completed` with mode `payment` and metadata link_id, mark the link paid, set the order's status_invoice_paid, sync the linked invoice to paid, insert into stripe_payments (with order_id) idempotently, and send emails. The existing event subscription already covers this.
- Shared rule `orderLinkAmount(net, vatEnabled, rate)` → cents, with tests (€399,99 + 19% = 47599 cents; VAT off = 39999). Tests for "replaced link can't be marked paid" and 401 for unauthenticated calls.
- UI: `src/components/dashboard/OrderStripeLinkDialog.tsx`; OrderRow swaps the Yearly button and moves "Move to yearly" into the menu; ClientInvoices gets the "Open payments" section.
- Testing only with the test client. A real payment test needs the Stripe test mode set up first (still open).
