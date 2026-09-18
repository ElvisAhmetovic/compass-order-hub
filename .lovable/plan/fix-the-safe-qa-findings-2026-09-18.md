# Fix the safe QA findings

Work through the QA report items that can be fixed without changing how anything else behaves. Riskier items (order-status rules, offer acceptance verification, online payments) are left out and listed at the end.

## What gets fixed

### 1. Part-paid invoices keep getting chased (B1)
Today, marking an invoice "partially paid" stops all further reminders. After the fix a partly paid invoice stays in the normal 7-day chase cycle, and the reminder email names the remaining balance instead of the full amount. Fully paid, cancelled and refunded invoices still stop, and clients with reminders switched off are still skipped.

### 2. Show what is still owed (B3)
- Invoice page: a small "Total / Paid / Outstanding" line.
- Invoice list: an outstanding column, so a part-paid invoice no longer looks the same as an unpaid one.

### 3. Money figures on the dashboard
Three figures at the top: owed to us, overdue, and invoiced this month. Read-only, calculated from existing invoices and payments.

### 4. No reminders at weekends or at night
Automatic client reminders only go out Monday to Friday, 09:00–17:00 (Sarajevo time). Anything due outside that window waits for the next working slot. Manual sending and internal team notifications are unaffected.

### 5. Offers get an expiry date (R2)
New offers expire 30 days after being sent. The client sees the date in the email and on the confirmation page; an expired link shows a clear "this offer has expired, contact us" message instead of creating an order. Offers already out there stay valid — the rule only applies to new ones.

### 6. Warnings strip for incomplete records (R5)
A compact panel listing orders with no client attached, clients with no portal login, and invoices with no email address, each clickable through to the record. Read-only, nothing is auto-created.

## Left out for now (need a decision from you)
- **VAT carried from offer to order to invoice (B2)** — touches order creation and invoice pre-fill; worth doing, but as its own round so pricing can be checked carefully.
- **Contradictory order statuses (R1)** — would change how status switches behave and needs a clean-up pass over existing orders.
- **Email confirmation on offer acceptance (R3)** — adds a step for clients; your call whether that friction is wanted.
- One search box, client history page, bulk actions, online payments, accountant export — larger features, separate rounds.

## Technical notes
- Reminder function `send-invoice-payment-reminders`: stop treating `partially_paid` as terminal; compute outstanding as `total_amount - sum(payments)` and use it in the email body; add a working-hours/weekday gate before sending, deferring `next_reminder_at` to the next allowed slot instead of clearing it.
- `src/pages/Invoices.tsx` line ~212: remove `partially_paid` from the statuses that clear `next_reminder_at`.
- Outstanding amount derived from the existing `payments` rows joined per invoice; no schema change for B3.
- New columns: `offers.expires_at` (timestamptz, nullable — null means no expiry, so existing offers are untouched), set to now + 30 days on send. Enforced in `ConfirmOffer.tsx` and in the offer-confirmation edge function so an expired link cannot create an order.
- Dashboard figures and warnings strip as new read-only components fed by aggregate queries.
- Verify with `npx tsgo --noEmit -p tsconfig.app.json` and the existing test suite; no emails sent to real clients during testing.
