# Invoices list: restore page number when going back

## Goal
When on page 5 (or any page) of the invoices list, opening an invoice and pressing "Back to Invoices" returns to that same page — not page 1.

## Current state
The page number is already part of the list-state work just completed:
- `src/pages/Invoices.tsx` reads the initial page from the URL (`?page=5`) and writes it back into the address whenever it changes.
- The filtered address (including the page) is saved so the detail page's back button can restore it.
- `src/pages/InvoiceDetail.tsx` "Back to Invoices" navigates to that saved address.

So the requested behavior should already work. This plan is about verifying it end to end and fixing anything that turns out to reset the page.

## Steps
1. Verify in the running preview (or by code trace if login blocks the browser check):
   - Go to invoices, jump to page 5, open an invoice, press "Back to Invoices" → list is on page 5 with the same filters.
   - Change a filter while on page 5 → page resets to 1 (intended, since the filtered result set changes).
   - Sidebar "Invoices" link → clean default view, page 1.
2. If the page resets unexpectedly, fix the cause (likely spots: the effect that resets `page` on filter changes firing on restore, or the saved-address restore dropping the `page` param).
3. Re-run the TypeScript check and test suite.

## Technical details
- Files involved: `src/pages/Invoices.tsx`, `src/pages/InvoiceDetail.tsx`.
- No new dependencies; uses the existing URL-param + saved-address mechanism.
- Note: authenticated in-browser verification may not be possible from the test environment (login wall); if so, the user confirms the behavior in the preview.
