# Remove unused statuses from the order status menu

## Change
In the order status menu, remove: Facebook, Instagram, Trustpilot, Trustpilot Deletion, Google Deletion. Review stays.

## What stays the same
- Orders already marked Trustpilot (4) or Google Deletion (2) keep that mark and their history.
- Sidebar pages, notification settings and reports are not changed.

## Technical details
- Edit the status list in `src/components/dashboard/MultiStatusBadges.tsx` (lines 54-58) to end at "Review".

## Verification
- Build check.
