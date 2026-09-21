# Offers: same date-range picker as Invoices

## Current state (confirmed)
- `src/pages/Offers.tsx` uses the old `DateRangeFilter` from `src/components/user-statistics/DateRangeFilter.tsx` (lines 41, 72–73, 318, 352–357) — a plain from/to picker with no quick ranges and no month choices.
- `src/pages/Invoices.tsx` now has the newer setup: a **Period** dropdown (`periodFilter` state, lines 77, 415–456, 668+) with All time / Today / This week / This month / Last month / This year / Last year, a **Specific month** list of the last 24 months (`monthOptions` memo, lines 527+), a **Custom range** option with From/To calendars, an active-range chip, and a "X of Y" count.

## What changes on Offers
Replace the old date filter with the same Period control, keeping the rest of the Offers page untouched:

1. Remove the `DateRangeFilter` import/usage and the `dateRange: DateRange` state.
2. Add `periodFilter` state (`all` default) plus `customFrom`/`customTo`, and a `dateRange` memo that parses `periodFilter` — including the `month:YYYY-MM` prefix for specific months — copied from Invoices.
3. Add the same `monthOptions` memo (last 24 months, e.g. "May 2026").
4. In the filter bar, render the Period dropdown between **Status** and **Sent by**:
   - All time / Today / This week / This month / Last month / This year / Last year
   - Specific month: last 24 months
   - Custom range → shows the fixed-position From/To calendars
5. Clear Filters resets `periodFilter` to `all` and clears custom dates (in addition to the existing resets).
6. Add the same active-range chip ("May 2026 ×" or "Custom range ×") under the bar, removable with one click.
7. Add the "X of Y offers" count next to the card title so it's obvious a filter is applied.
8. The existing search, Status, and Sent by filters, the table, and all offer actions stay exactly as they are.

## Result
Both Invoices and Offers will have the identical date filtering: quick ranges, pick-a-month, and custom from/to — same look, same behavior.

## Technical notes
- All edits in `src/pages/Offers.tsx` only.
- Reuse the Invoices.tsx implementation as the template (period parsing, monthOptions, chip, count).
- No data, email, or offer-workflow changes. No changes to Invoices.
- Verify with a typecheck afterward.
