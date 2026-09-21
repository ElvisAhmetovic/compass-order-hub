# QA Report #2 — September 21, 2026

Follow-up to `QA_REPORT.md`. Nothing here repeats the earlier findings. Live numbers taken from the database on the day of writing.

## Live health snapshot

| Figure | Value |
| --- | --- |
| Orders (not deleted) | 1,351 |
| Orders with no linked client | 1,284 |
| Invoices total | 1,066 (771 paid, 283 unpaid, 12 draft) |
| Unpaid amount | €66,289.07 |
| Unpaid invoices past their due date | 245 |
| Past-due invoices never chased once | 39 |
| Open invoices with no next reminder scheduled | 41 |
| Clients without a portal login | 622 |
| Drafts older than 30 days | 12 |
| Invoices ever marked "overdue" or "partially paid" | 0 |

## Bugs

- **B1. 245 invoices are past due but still show as "sent".** Nothing ever flips an invoice to overdue, so the overdue figure on the dashboard is the only place lateness shows, and reports/filters by status are misleading.
- **B2. 39 late invoices have never been chased, and 41 open invoices have no next reminder date.** These were created before reminders were scheduled, so they sit silently. No backfill exists.
- **B3. Invoice creation logic exists twice** — once on the automatic status change, once on the manual button — and the two copies already differ (different team recipients, different audit label). A fix applied to one will not apply to the other.
- **B4. Double invoice on double-click.** The "already invoiced?" check and the actual creation are separate steps with no lock, so two fast clicks (or button + automatic status change together) hit the database rule and show an error instead of being prevented.
- **B5. Two clicks on an offer link can create two orders.** The confirmation checks "already confirmed" and writes "confirmed" as separate steps.
- **B6. Orders with no contact email get a made-up client address** (`companyname@company.com`). A second order from a different business with the same name reuses that same fake client, mixing two businesses' invoices onto one client record.
- **B7. Monthly billing catch-up can email a client repeatedly.** If invoice creation keeps failing, the row is reset and re-emailed on every catch-up run — no attempt limit.

## Risks

- **R1. Client invoices page is a placeholder.** Clients who log in see "coming soon" under Invoices, and the database rules give clients no access to invoices at all.
- **R2. Team recipient lists are hardcoded in at least 8 places** and have already drifted — two colleagues are missing from the offer-confirmation notification. Adding or removing a person means editing every one.
- **R3. Status changes fire six follow-up actions with no rollback.** Each failure is logged to the console only, so a half-finished change (invoice synced, client never notified) is invisible.
- **R4. 1,284 of 1,351 orders have no linked client.** The portal, client emails and the client view depend on that link, so most of the business is effectively outside the portal.
- **R5. Client portal safety relies only on database rules**; the pages themselves do no ownership check as a second layer.
- **R6. Offers are not re-validated at acceptance.** If an offer row is edited after sending, the order is created from the stored snapshot.

## Ideas, ranked

1. Mark invoices overdue automatically and backfill the 245 that already are, plus schedule reminders for the 41 with none.
2. One shared invoice-creation routine used by both paths (closes B3, B4, B6).
3. Build the client invoice page properly: clients see their own invoices, amounts, due dates and paid status.
4. Bulk-link existing orders to clients by company/email match, with a review step.
5. One team-recipient list in the database, used by every notification.
6. Make offer acceptance and invoice creation single-step operations (closes B4, B5).
7. Attempt limit on monthly billing retries.
8. A result panel after a status change showing what was sent and what failed.
9. Aging report: who owes what, 0–30 / 31–60 / 60+ days.
10. Monthly revenue and VAT export for the accountant.
