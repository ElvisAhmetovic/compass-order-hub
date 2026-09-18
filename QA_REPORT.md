# QA Report — Money Correctness & Daily Work

Date: 18 September 2026. Scope: order/offer pricing, invoices, payments, reminders, and everyday usability. Findings are grouped Bug / Risk / Idea. Each item says what was checked, what was found, and what to do.

---

## Fixed in this round

### VAT now works from the total you type
**Was:** the price you typed was treated as net and VAT was added on top — type 100 with 20% and the client got a bill for 120.
**Now:** the price you type is the total. Net and VAT are calculated backwards from it.

```text
Total (entered)   100.00
Net                83.33
VAT 20%            16.67
```
The offer email shows the same three numbers, and the amount saved on the offer equals what you typed. Offers created before today are unchanged.

### Resent offers keep their VAT breakdown
**Was:** re-sending an offer sent the email without the VAT lines, so the client received a version that looked different from the original.
**Now:** the original VAT rate and net amount travel with the resend.

---

## Bugs

### B1. A partly paid invoice is never chased again
When a client pays part of an invoice, the invoice is marked "partially paid" and its next reminder date is **cleared**. No further automatic reminder is ever sent for the unpaid remainder — it silently drops out of the chase list.
**Fix:** keep chasing partially paid invoices on the normal interval, with the wording naming the remaining balance instead of the full amount.

### B2. VAT is lost when an accepted offer becomes an order
The offer stores the VAT rate and net amount, but the order created when the client accepts copies only the single total price. The VAT split disappears, so an invoice built from that order has to be re-entered by hand.
**Fix:** carry VAT rate, net and VAT amount onto the order and pre-fill them on the invoice.

### B3. No remaining balance shown anywhere
Neither the invoice list nor the invoice page shows how much is still outstanding — only the full amount and a status label. With partial payments in play this is the number people actually need.
**Fix:** show "paid / outstanding" on the invoice page and an outstanding column in the list.

---

## Risks

### R1. Contradictory order statuses are possible
Order states are independent switches, not one setting. An order can be marked cancelled and invoice-paid at the same time; nothing prevents it. This distorts revenue figures.
**Fix:** rules that clear conflicting states, plus a one-off check of existing orders.

### R2. Offers never expire
An offer link stays valid and acceptable forever. A price quoted months ago can be accepted today and becomes a real order at the old price.
**Fix:** an expiry date on offers (default 14 or 30 days), shown to the client and enforced on the confirmation page.

### R3. Anyone with an offer link can accept it
The confirmation page is public and protected only by the unguessable link. Fine in practice, but an accepted offer creates a real order with no further confirmation.
**Fix:** ask the client to type their email to confirm, and record the acceptance IP and time.

### R4. Reminders can go out at weekends
The chase job runs every 15 minutes, every day. Clients can receive a payment reminder on Saturday — this already happened once.
**Fix:** a sending window (for example weekdays 09:00–17:00).

### R5. No warning for incomplete records
Orders with no client attached, clients with no portal login, and invoices with no email address are all silently accepted, and only surface when something fails to send.
**Fix:** a small warnings strip on the dashboard listing these records.

---

## Daily work: what is missing

- **One search box.** Search today only covers orders. Clients, invoices, offers and tickets are not searchable from one place.
- **Bulk actions.** Status changes and assignment are one order at a time.
- **Money at a glance.** The dashboard has no "owed to us", "overdue", "invoiced this month" figures.
- **Offer overview.** No quick view of which offers are pending, accepted or gone stale.
- **Client history.** No single page showing a client's orders, invoices, payments and tickets together.

---

## Ideas, ranked

| # | Idea | Value | Effort |
|---|------|-------|--------|
| 1 | Outstanding balance + keep chasing partial payments (B1, B3) | High | Low |
| 2 | Dashboard money figures: owed, overdue, this month | High | Low |
| 3 | Offer expiry date (R2) | High | Low |
| 4 | Carry VAT from offer to order to invoice (B2) | High | Medium |
| 5 | One search box across everything | High | Medium |
| 6 | Reminder sending window, no weekends (R4) | Medium | Low |
| 7 | Client history page with full timeline | Medium | Medium |
| 8 | Online payment links so clients pay by card | High | High |
| 9 | Monthly revenue and VAT export for the accountant | Medium | Medium |
| 10 | Bulk actions on the order list | Medium | Medium |

**Suggested next block:** items 1, 2, 3 and 6 — all small, and together they close the money leaks and make the first screen useful.
