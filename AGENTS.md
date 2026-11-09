# Architecture rules

- Company money totals (dashboard finance cards, dashboard status-card € sums, invoice Outstanding/Paid, monthly Revenue) render only when `canViewFinanceTotals(user.email)` from `src/config/financeAccess.ts` passes — why: owner-only privacy via a fixed email allowlist, so new accounts never see them.
- Keep the approved English/German payment-reminder wording in `src/services/paymentReminderCopy.ts` for client-side editors; automatic invoice reminders and server fallback must mirror it — why: all client payment-reminder channels should deliver the same requested message.
- Keep active payment-account instructions consistent across browser PDFs, offer PDFs, monthly PDFs, and reminder functions — why: customers must never receive conflicting bank details from different sending paths.
- Keep the root route as the public Empria homepage for every visitor, including authenticated users — why: opening empriatech.com must never redirect away from the company homepage.
- Keep public marketing routes and shared public-site navigation separate from authenticated CRM and client areas — why: service pages must remain indexable and accessible without a session.
- Keep public legal content in the shared bilingual legal-page system and link every public legal page from the footer — why: company disclosures must stay consistent across the marketing site.
- Keep the landing page and `/kontakt` on the shared public contact-form component and validation schema — why: both inquiry entry points must submit and validate identically.

- AI win-back offers: drafts are created by `outreach-scan` and only sent by `outreach-send` after a team member approves; rules live in `supabase/functions/_shared/outreachRules.ts` — why: no AI email reaches a client without human review.
- AI outreach drafts read full client context (orders incl. internal notes, invoices, packages) via `supabase/functions/_shared/outreachContext.ts`, skip clients with unpaid invoices, and suggest only services from `service_catalog`/`service_insights` — why: offers must be grounded and never reach clients who owe money.

- Follow `PROJECT_RULES.md` (pre-build spec, tests, verification gates, read-only live data) for every change — why: team quality rules adapted to this project.
- Stripe subscriptions for monthly packages: all Stripe calls go through `stripe-billing` (team/client actions, ownership checked server-side) and status/payments change only in the signature-verified, idempotent `stripe-webhook`; `generate-monthly-installments` skips contracts Stripe bills (`stripeBillsContract`) — why: no double billing and no client-trusted payment state.
- New orders, monthly packages and accepted offers call `ensure-client-portal`, which creates a client portal account only when none exists and never resets an existing password — why: every client can reach their orders and payments without a manual step.
