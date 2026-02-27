

## Fix: Date Range Filter in Advanced Search

### Problem Analysis
The date range filter in the Advanced Search dialog has two issues:

1. **The `dateRange` object type allows `undefined` values for `from`/`to`**, but the Calendar's `onSelect` can pass `undefined`. When spreading `...filters.dateRange` (which starts as `undefined`), partial updates may not accumulate correctly if React batches state updates.

2. **Timezone mismatch**: `order.created_at` is a UTC timestamp from Supabase, but the Calendar returns local midnight dates. `setHours(0,0,0,0)` adjusts in local time, which can exclude orders near midnight boundaries.

### Changes

**`src/services/searchService.ts`** — Make the date comparison more robust:
- Parse `from` and `to` safely with fallback (handle case where they're strings after state serialization)
- Normalize both order date and filter dates to date-only comparison (strip time entirely)

**`src/components/dashboard/AdvancedSearch.tsx`** — Fix the date selection to ensure both `from` and `to` are preserved:
- Initialize `dateRange` properly when first date is selected
- Ensure `from` and `to` don't get lost during partial updates
- Add a "clear dates" button for better UX

### Specific Code Fixes

**searchService.ts** (date filter, ~line 144):
```typescript
if (filters.dateRange?.from && filters.dateRange?.to) {
  const fromDate = new Date(filters.dateRange.from);
  const toDate = new Date(filters.dateRange.to);
  fromDate.setHours(0, 0, 0, 0);
  toDate.setHours(23, 59, 59, 999);
  
  result = result.filter(order => {
    if (!order.created_at) return false;
    const orderDate = new Date(order.created_at);
    return orderDate >= fromDate && orderDate <= toDate;
  });
}
```

**AdvancedSearch.tsx** (date selection handlers, ~lines 213-244):
- Change from individual `from`/`to` updates to preserve existing values:
```typescript
onSelect={(date) => {
  const current = filters.dateRange || {};
  handleFilterChange('dateRange', {
    from: date,
    to: current.to
  });
}}
// and for "to":
onSelect={(date) => {
  const current = filters.dateRange || {};
  handleFilterChange('dateRange', {
    from: current.from,
    to: date
  });
}}
```

These are small, targeted fixes — no new files or components needed.

