# QA Round: Money Correctness + Daily-Work Improvements

Output is a written QA report first. The one exception is the VAT input change you described, which is specified here as a concrete fix ready to build once you approve.

## 1. VAT: price you type becomes the total (confirmed issue)

Today, in the order/offer form the price you type is treated as the **net** amount and VAT is added on top: type 100 with 20% and the client sees a total of 120.

What you want: type 100 with 20% and the client pays **100**, with the breakdown derived backwards:

```text
Total (you type)   100.00
Net                 83.33   = 100 / 1.20
VAT 20%             16.67   = 100 - 83.33
```

Change covers:
- The live breakdown shown while creating the order (net, VAT, total).
- The amount saved on the offer (already the gross figure, so the stored total stays 100) and the net/VAT values stored alongside it.
- The offer email sent to the client, so its breakdown matches the form.
- Rounding: total stays exactly what you typed; VAT = total - net, so the three numbers always add up.

Open point: existing offers/orders already created with the old logic are left as they are — no back-editing of past records.

## 2. Money correctness QA (report)

Areas tested and written up, each with a verdict and a recommended fix:
- Offer resend: the resend path currently loses the VAT breakdown, so a resent offer can look different from the original.
- Offer to order: VAT figures on the offer are not carried into the created order, so the order shows only a single price.
- Invoice totals versus order price: whether VAT, discounts and line items reconcile with the original offer.
- Partial payments: what the invoice shows when a client pays part of the amount, and whether status and remaining balance stay right.
- Duplicate invoices and invoice numbering under fast repeated clicks.
- Monthly installments: amounts, VAT treatment and duplicate protection across the monthly job.
- Currency formatting consistency (European format) across screens, PDFs and emails.

## 3. Daily-work UX QA (report)

- Global search across orders, clients, invoices and offers from one box.
- Order list: bulk actions, clearer filters, and whether status flags can contradict each other.
- Offer screen: visibility of accepted/pending/expired and expiry of stale offers.
- Invoice screen: outstanding balance and next reminder date at a glance.
- Dashboard: money owed, overdue, and this-month revenue as first-screen numbers.
- Missing-data warnings: order without a client, client without a portal login, invoice without an email address.

## 4. Ideas list

Each idea gets an impact/effort rating so you can pick: real online payment links, client-facing offer expiry, quote-to-invoice in one click, per-client statement, activity timeline per client, and exportable financial reports.

## Deliverable

A single `QA_REPORT.md` you can download, with findings grouped as Bug / Risk / Idea, each with evidence and a proposed fix. No behaviour changes are made while writing the report, except the VAT change in section 1 if you approve it in the same go.

## Technical notes

- VAT change touches `CreateOrderModal.tsx` (display breakdown and the offer insert/send payload) and the `send-offer-email` edge function's VAT rendering; `offers.order_data` keeps `vatEnabled`, `vatPercentage`, `netPrice` with net now derived as `price / (1 + rate/100)`.
- QA is performed by reading code, querying the live database read-only, and driving the local preview with a browser; no migrations and no emails sent to real clients.
