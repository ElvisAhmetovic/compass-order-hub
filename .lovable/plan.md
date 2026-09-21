# Fix the jumping date pickers and the laggy invoice list

## 1. The From / To calendars jump around

When you change month, a calendar with 5 week-rows becomes 6 (or the other way round), so the popup grows or shrinks and repositions itself above or below the button.

Fix:
- Give the calendar popup a fixed height so every month occupies the same space — no growing or shrinking, no repositioning.
- Anchor the popup to the bottom-start of the button so it stays put instead of flipping.
- Reserve the row for the From / To controls so the card below doesn't shift when the custom range appears.

## 2. The page is slow

Every invoice in the system (currently over a thousand) is drawn as a table row at once, and each row carries its own menus, tooltips and confirmation dialogs. That is what makes the filters, typing and scrolling feel sluggish.

Fix:
- Show 25 invoices per page with simple Previous / Next paging and a "Page X of Y" label. Changing a filter, sort or search resets to page 1.
- The "Showing X of Y · Total" line keeps reporting the full filtered set, not just the current page, so month totals stay correct.
- Make the search box responsive by only applying the typed text after a short pause, so each keystroke no longer re-filters everything.
- Compute search matching once per invoice instead of rebuilding date text on every keystroke.

Nothing about invoice data, statuses, reminders or amounts changes — this is display speed and popup behaviour only.

## Technical detail

- `src/pages/Invoices.tsx`: wrap `PopoverContent` calendars with `align="start"` `sideOffset={4}` and a fixed-height wrapper (`h-[352px]`); pass `showOutsideDays` so short months still fill six rows.
- Add `useDebouncedValue`-style local debounce (250 ms) for `filterText`; memoise `filteredInvoices` on the debounced value.
- Add `page` state, `PAGE_SIZE = 25`, derive `pagedInvoices` from `sortedInvoices`; reset `page` in an effect keyed on filters/sort/search.
- Table body maps `pagedInvoices`; counts and `visibleTotal` keep using `sortedInvoices`.
