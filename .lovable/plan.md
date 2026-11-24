# Assistant: next useful abilities

Ideas grouped by value. Every change still waits for a Confirm click; nothing is deleted or refunded.

## Batch 1 (recommended first)
1. **Daily briefing** - "What needs attention today?": overdue invoices, failed Stripe payments, packages ending soon, open tickets, reminders due today.
2. **Client 360 summary** - "Tell me everything about client X": orders, invoices, open balance, packages, portal activity, tickets, last contact.
3. **Send payment reminders** - propose a reminder for one or several overdue invoices, using the approved EN/DE reminder wording.
4. **Bulk actions** - "Mark these 5 invoices paid" or "set all orders from last week to In progress" as one confirm card with a list.
5. **Create support tickets** - open a new ticket for a client from chat.

## Batch 2
6. **Reports on demand** - monthly revenue, top clients, unpaid by age, orders per team member; downloadable as a spreadsheet (finance totals only for owner accounts).
7. **Email drafting** - draft a client email (follow-up, offer, apology) for review, then send after Confirm from the company sender.
8. **Offers** - create an offer for a client and send it after Confirm.
9. **Stripe order payment links** - create and send a one-time payment link for an order.

## Batch 3
10. **Proactive alerts in the bubble** - small badge when something urgent appears (failed payment, chargeback).
11. **Upload and read files** - drop a PDF or screenshot (e.g. a bank statement) and ask it to match payments to invoices.
12. **Saved shortcuts** - one-click prompts like "Today's briefing" or "Unpaid over 30 days".

## Technical notes
- New read tools stay inside the whitelist in `_shared/assistantRules.ts`; new write tools go through `assistant_actions` + `admin-assistant-confirm`.
- Reminders reuse `paymentReminderCopy.ts`; payment links reuse `stripe-billing`; finance figures respect `canViewFinanceTotals`.
- Tests per new rule (finance guard, unpaid-skip, bulk confirm), 401/403 checks on functions.

Approve to build Batch 1, or reply with the numbers you want.
