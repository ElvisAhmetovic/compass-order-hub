# Invoices: Cancelled filter, month picker, sorting cleanup

## 1. Why "Cancelled" looks broken

I checked the live data: there are currently **no cancelled invoices at all** (771 paid, 282 sent, 12 draft). So the filter itself works — it just returns an empty list with no explanation, which reads as broken.

Changes:
- Show a clear empty state when a filter combination matches nothing: "No invoices match these filters" plus a "Clear filters" button, instead of a blank table.
- Show the count of matching invoices next to each status option is overkill; instead, the filter bar will show "X of Y invoices" so it's obvious the filter applied.
- Add the missing **Refunded** option to the status filter (the status exists everywhere else but is not selectable).

Note: cancelling still works — marking an invoice cancelled from the row menu, or cancelling its order, will set the status and it will then appear under Cancelled.

## 2. Pick a specific month (e.g. May 2026)

The Period dropdown gets a new **"Specific month"** section listing the last 24 months (September 2026, August 2026, ... ) plus the existing quick ranges. Picking one sets the range to the 1st through the last day of that month automatically — no manual from/to needed.

New Period dropdown structure:
- All time
- Today / This week / This month / Last month / This year / Last year
- Month: September 2026 … (last 24 months)
- Custom range

The "Paid" card's month dropdown stays, and keeps driving the list (paid + that month), now using the same month values so the two controls stay in sync.

## 3. Is "Sort by" redundant?

No — it does a different job. Period filters *which* invoices show; Sort decides *the order* of what's left (newest, oldest, invoice number, client A→Z). Keeping both is the right call, but the bar gets tidier:

- Order the controls as: Status | Period | Sort | Search.
- When a specific month or custom range is active, show a small removable chip (e.g. "May 2026 ×") under the bar so the active range is obvious at a glance.
- Keep "Clear filters" visible whenever any filter is active.

No merging of Sort into Period.

## Technical notes

All changes are in `src/pages/Invoices.tsx`:
- `periodFilter` accepts `month:YYYY-MM`; `dateRange` memo parses that prefix and returns the month's first/last day.
- Reuse the existing `monthOptions` memo for the Period dropdown items.
- `handlePaidMonthChange` sets `periodFilter` to `month:YYYY-MM` instead of `custom` + manual from/to.
- Add `refunded` to the status Select.
- Add an empty-state row in the table body when `sortedInvoices.length === 0` and filters are active.
- Add the active-range chip and "X of Y" count in the card header.

No data, workflow, email or reminder behaviour changes.
