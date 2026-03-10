

## Add "Created Only" Filter to Advanced Search

The boss wants a second quick-filter alongside "Unpaid Orders Only" that shows orders with only the "Created" status -- orders that haven't progressed yet and also count as unpaid.

### Changes

**`src/services/searchService.ts`**
- Add `createdOnly?: boolean` to `SearchFilters` interface
- Add filter logic in `applyFiltersToOrders`: if `createdOnly` is true, keep only orders where `status_created === true` and no further progress statuses are active (`status_in_progress`, `status_invoice_sent`, `status_invoice_paid`, `status_resolved`, `status_cancelled` are all falsy)

**`src/components/dashboard/AdvancedSearch.tsx`**
- Add a second checkbox below "Unpaid Orders Only" labeled "Created Only (Not Yet Started)" with description "(Orders still at Created status — no invoice sent or paid)"
- Include `createdOnly` in the active filter count

Both filters can work independently or together.

