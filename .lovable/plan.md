

## Fix Tech Support Page Layout

### Problem
The content container on line 156 uses `flex-1 flex` which creates a **horizontal** flex layout. The header (with buttons) and the ticket cards are placed side-by-side instead of stacked vertically, pushing the "Create Ticket" buttons off-screen.

### Fix
**File: `src/pages/TechSupport.tsx`**
- Change `className="flex-1 flex p-6 space-y-6"` to `className="flex-1 flex flex-col p-6 space-y-6"` on the main content wrapper (line 156)
- Same fix on the loading state (line 146): add `flex-col`

This matches the standard admin page layout pattern used across other pages.

