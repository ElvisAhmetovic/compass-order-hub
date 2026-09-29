# Architecture rules

- Company money totals (dashboard finance cards, dashboard status-card € sums, invoice Outstanding/Paid, monthly Revenue) render only when `canViewFinanceTotals(user.email)` from `src/config/financeAccess.ts` passes — why: owner-only privacy via a fixed email allowlist, so new accounts never see them.
