

## Add "Unpaid Orders" Filter to Advanced Search

### What it does
Adds a toggle in the Advanced Search dialog to filter orders where an invoice has been sent but not yet paid (`status_invoice_sent = true` AND `status_invoice_paid = false`).

### Changes

**`src/services/searchService.ts`**
- Add `unpaidOnly?: boolean` to the `SearchFilters` interface
- In `applyFiltersToOrders`, add logic: if `unpaidOnly` is true, filter to orders where `status_invoice_sent === true && status_invoice_paid !== true`

**`src/components/dashboard/AdvancedSearch.tsx`**
- Add a checkbox for "Unpaid Orders Only" in the filter dialog (between Status and Priority sections)
- Include `unpaidOnly` in the active filter count
- Wire it to `handleFilterChange('unpaidOnly', checked)`

Three files, minimal changes each.

