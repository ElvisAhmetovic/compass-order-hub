# Fix Monthly Packages layout overflow

## Problem
On the Monthly Packages page, each contract row's header is a single flex line packing: client info (left) + price block + 160px progress bar + status badge + Portal button + delete icon (right). On normal screen widths (especially with sidebar open) this row overflows horizontally, pushing the right-side controls (Portal, delete, etc.) off-screen and forcing the user to zoom out or scroll right.

Root cause is in `src/components/monthly/MonthlyInstallmentsTable.tsx` — the header row uses `flex items-center justify-between` with no wrapping or min-width control, so the long client name/email/website block expands and pushes everything else out of view.

## Fix
Make the contract header responsive so it always fits on screen:

1. Allow the header to wrap onto a second line on narrower viewports (`flex-wrap`, `gap-y`).
2. Add `min-w-0` and truncation to the left client-info block so a long email/website cannot push the row wider than its container.
3. Add `shrink-0` and `ml-auto` to the right-side controls group so it stays visible and aligned right.
4. Slightly tighten the right-side spacing (`gap-3` instead of `gap-6`) and let the progress bar shrink on small widths (`w-32 md:w-40`).

No changes to logic, data, or any other page. Pure layout/CSS adjustments inside the existing component.

## Files
- `src/components/monthly/MonthlyInstallmentsTable.tsx` — header row container only (around lines 342–432).
