# Architecture rules

- Company money totals (dashboard finance cards, dashboard status-card € sums, invoice Outstanding/Paid, monthly Revenue) render only when `canViewFinanceTotals(user.email)` from `src/config/financeAccess.ts` passes — why: owner-only privacy via a fixed email allowlist, so new accounts never see them.
- Keep the approved English/German payment-reminder wording in `src/services/paymentReminderCopy.ts` for client-side editors; automatic invoice reminders and server fallback must mirror it — why: all client payment-reminder channels should deliver the same requested message.
- Keep active payment-account instructions consistent across browser PDFs, offer PDFs, monthly PDFs, and reminder functions — why: customers must never receive conflicting bank details from different sending paths.
- Keep the root route public for signed-out visitors and preserve role-based workspace redirects for authenticated users — why: empriatech.com serves both the Empria company homepage and the existing CRM entry point.
