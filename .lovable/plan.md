# Invoices: date filtering and a working month selector

## What's wrong today

- The month dropdown next to the "Paid" card only changes the money figure in that card. It does not change the invoice list below, so picking "July 2026" appears to do nothing.
- The only dropdown for the list mixes two different jobs: sorting (newest, A-Z) and status filtering (sent, draft, paid). You cannot sort *and* filter at the same time.
- There is no way to limit the list to a day, week, month, year, or a custom from-to range.

## What will change

### 1. A proper filter bar above the invoice list

Three controls, side by side with the existing search box:

- **Status**: All / Draft / Sent / Paid / Partially paid / Overdue / Cancelled
- **Period**: All time / Today / This week / This month / This year / Last month / Last year / Custom range
- **Sort**: Newest, Oldest, Lowest INV #, Highest INV #, A to Z, Z to A

Choosing "Custom range" reveals two date pickers (From / To). Both are optional, so "everything from 1 July onwards" works.

All three combine: e.g. paid invoices in July 2026 sorted oldest first.

### 2. The month picker on the Paid card actually drives the list

Picking a month there sets the list period to that month and the status to Paid, so the number in the card and the rows below always match. A small "Clear" control returns the list to All time / All statuses.

### 3. Result count

Under the filter bar: "Showing X of Y invoices" plus the summed total of what is currently shown, so a month's paid or unpaid figure is visible at a glance.

## Notes

- Dates are matched on the invoice **issue date** (the date shown in the Issue / Created column).
- Weeks run Monday to Sunday.
- Nothing about invoice creation, sending, reminders, statuses or amounts changes — this is filtering and display only.

## Technical detail

- `src/pages/Invoices.tsx`: split `sortOption` into `statusFilter`, `periodFilter` (+ `customFrom` / `customTo`), and `sortOption`. Add a `dateRangeForPeriod()` helper returning `{from, to}` in local time; apply it in the existing `sortedInvoices` memo before sorting.
- Use the shadcn Popover + Calendar datepicker pattern with `pointer-events-auto` for the custom range inputs.
- `selectedPaidMonth` change handler also sets `periodFilter = 'custom'` with that month's bounds and `statusFilter = 'paid'`.
- Filtered totals derive from the same memo, so card and list cannot diverge.
