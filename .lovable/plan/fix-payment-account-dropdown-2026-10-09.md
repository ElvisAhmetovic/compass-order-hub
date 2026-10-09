# Fix Payment Account dropdown

## Problems found
1. **Choice never sticks:** every settings change forces the payment account back to an old value ("germany"), which the app reads as "both accounts". So picking "German only" or "Revolut only" is overwritten instantly.
2. **Sidebar disappears when the dropdown opens:** the dropdown locks page scrolling while open, which knocks the sticky sidebar out of place.

## Fix
- Stop overwriting the payment account choice when settings change, so "Both", "German only" and "Revolut only" are kept, shown in the panel, the invoice preview and the downloaded/sent PDF.
- Treat old saved "germany" values as "Both" once, on load only.
- Keep the page layout steady while any dropdown is open, so the sidebar stays in place (applies to all dropdowns in the CRM).

## Technical details
- `src/components/invoices/hooks/useInvoiceSettings.ts`: `updateSettings` currently does `{ ...prev, ...newSettings, selectedPaymentAccount: "germany" }` — remove the forced field.
- Global CSS (`src/index.css`): neutralise the Radix scroll-lock side effects (`body[data-scroll-locked] { margin-right: 0 !important; overflow: visible }` style override, keeping `html` scrollbar) so the sticky sidebar does not shift/vanish.
- Extend `paymentAccountChoice.test.ts` with a test that updating another setting keeps the chosen account.
- Verify build; CRM sign-in not available from here, so the user confirms in Template Settings.
