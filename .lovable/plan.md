

## Add Filters to Offers Page

### What
Add three filters below the existing search bar:
1. **Status filter** — dropdown to filter by "All", "Sent", or "Confirmed"
2. **Date range filter** — reuse the existing `DateRangeFilter` component (from `src/components/user-statistics/DateRangeFilter.tsx`)
3. **Sent-by filter** — dropdown populated from unique `sent_by_name` values in the offers list

Plus a "Clear All Filters" button when any filter is active.

### How

**File: `src/pages/Offers.tsx`**

1. Add state variables: `statusFilter` (string, default `"all"`), `dateRange` (DateRange | undefined), `sentByFilter` (string, default `"all"`)
2. Import `Select` components and `DateRangeFilter`
3. Add a filter row below the search bar with:
   - Status Select: All / Sent / Confirmed
   - DateRangeFilter component (already has presets like This Month, Last 30 Days, etc.)
   - Sent By Select: dynamically built from `[...new Set(offers.map(o => o.sent_by_name))]`
   - Clear All Filters button (shown when any filter is active)
4. Extend the existing filtering logic to chain: search term → status → date range → sent-by
5. Update the badge count to show filtered count vs total

### Technical Details
- Reuse `DateRangeFilter` from `src/components/user-statistics/DateRangeFilter.tsx` and `DateRange` type from `src/utils/dateRangeHelpers.ts`
- Date filtering compares `offer.created_at` against `dateRange.from` and `dateRange.to`
- All filtering is client-side (offers are already fully loaded)

### Files to modify
1. `src/pages/Offers.tsx` — Add filter state, UI, and filtering logic

