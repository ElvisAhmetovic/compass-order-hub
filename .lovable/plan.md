

## Fix Offer Details Dialog Overflow

The description text in the View Offer dialog can grow unbounded, pushing the dialog beyond the viewport with no scroll.

### Fix
In `src/pages/Offers.tsx`, add `max-h-[80vh] overflow-y-auto` to the `DialogContent` so long descriptions become scrollable instead of overflowing off-screen. Also cap the description block itself with `max-h-[200px] overflow-y-auto`.

### File
- `src/pages/Offers.tsx` — line 260: add scroll constraints to DialogContent and description area

