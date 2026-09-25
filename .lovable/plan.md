# Keep Invoices list position when going back

## Problem
On the Invoices page, the search text, status/period/month filters, sort choice, and page number live only in memory. Opening an invoice and pressing "Back to Invoices" reloads the page to defaults, so the boss loses his search.

## Fix
Store the list state in the page's web address (URL parameters) instead of only in memory:

- Search text, status filter, period filter, custom from/to dates, paid month, sort option, and current page all become URL parameters (e.g. `/invoices?q=berger&status=paid&sort=newest&page=2`).
- Typing in the search bar or changing a filter updates the address silently (no page reload, no extra browser-history entries — use `replace` so the Back button still goes to the previous page, not through every keystroke).
- "Back to Invoices" on the invoice detail page returns to the exact address the user came from, so the list appears exactly as left: same search, same filters, same page.
- Opening `/invoices` fresh (from the sidebar) shows the default view as today.
- Bonus: a filtered view can be bookmarked or shared as a link.

## Technical details
- `src/pages/Invoices.tsx`: replace the plain `useState` for `filterText`, `statusFilter`, `periodFilter`, `customFrom`, `customTo`, `selectedPaidMonth`, `sortOption`, and `page` with `useSearchParams`-backed state (read initial values from the URL, write changes back with `setSearchParams(..., { replace: true })`). Keep the existing debounce for the search input.
- `src/pages/InvoiceDetail.tsx`: the back button already navigates to `/invoices`; no change needed there since the URL itself carries the state. Verify it does not hard-reset.
- No database, email, or design changes.

## QA
- Run the existing test suite and TypeScript check.
- Manual check in preview: search for an invoice, open it, press Back to Invoices — the search and filters are still applied. Also verify: sidebar "Invoices" link gives a clean default view; changing filters doesn't pile up browser-history entries.
