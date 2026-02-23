

## Add Back to Dashboard Button on Customer Tickets Pages

### Problem
The Customer Tickets page and detail page have no way to navigate back to the dashboard.

### Changes

| File | Change |
|------|--------|
| `src/pages/CustomerTickets.tsx` | Add a "Back to Dashboard" button next to the page title, using `navigate('/dashboard')` |
| `src/pages/CustomerTicketDetail.tsx` | Already has a "Back" button -- no change needed |

### Implementation

In `CustomerTickets.tsx`, add a `Button` with `variant="ghost"` and an `ArrowLeft` icon before the title, navigating to `/dashboard` on click (matching the pattern used on other pages like Settings).

