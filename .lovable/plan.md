# Fix yearly package delete not removing item from list

## Problem
On the Yearly Packages page, deleting a yearly package appears to do nothing — the row stays on the list. The delete itself does work (it's a soft delete that sets `deleted_at` / `status_deleted` on the `orders` row), but the Yearly Packages list keeps showing the deleted row.

## Root cause
`OrderService.getYearlyPackages()` in `src/services/orderService.ts` fetches every row where `is_yearly_package = true` without filtering out soft-deleted records. The regular `getOrders()` path already excludes them with `.is('deleted_at', null).neq('status_deleted', true)`, but the yearly-packages path doesn't, so deleted yearly packages reappear on every refresh.

## Fix
Add the same soft-delete filter to `getYearlyPackages()` so deleted yearly packages disappear from the Yearly Packages list (they'll still show up correctly in the Deleted page, which queries them explicitly).

Single small change, no schema changes, no other pages affected.

## Files
- `src/services/orderService.ts` — `getYearlyPackages()` query (around lines 264-282).
