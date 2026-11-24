# Assistant improvements
- [x] Daily attention briefing with exact counts and actionable records.
- [x] Client summary across orders, billing, packages, tickets, portal activity and contact history.
- [x] Confirmed invoice reminders with eligibility checks and approved wording.
- [x] Explicit bulk status changes with review list and per-record results.
- [x] Validate the existing support-ticket creation flow using fake data.
- [x] Function tests, full application tests, quality checks, deployed permission checks and read-only live queries.
- [ ] Signed-in end-to-end verification: blocked by external unmanaged authentication; no admin session available. Live writes/emails also require per-run approval.

## Approved behavior
- Given an admin, when they request today's briefing, then return real attention counts without exposing owner-only totals.
- Given an identified client, when asked for their summary, then combine linked records and disclose missing/failed lookups.
- Given overdue invoices, when reminders are proposed, then display recipients and send only after Confirm; skip paid/cancelled/paused/opted-out records.
- Given an explicit list of order or invoice IDs, when a bulk status change is confirmed, then show each target and report each outcome without deleting records or changing Stripe payment state.
- Given a valid client order, when ticket creation is confirmed, then create an open ticket using that order's contact details.