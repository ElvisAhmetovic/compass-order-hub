# Extensive CRM Regression QA After the Makeover

## Scope

Test the CRM presentation and core workflows affected by the global font/color refresh and the new work-break banner. The pass will be non-destructive: no real client emails, reminders, invoices, offers, or permanent production records will be created.

## 1. Automated foundation

- Run the full TypeScript check and existing test suite as the baseline.
- Add focused automated tests for Sarajevo-time break logic:
  - Monday–Friday only.
  - 12:00 inclusive through 13:00 exclusive.
  - 15:00 inclusive through 15:30 exclusive.
  - Exact start/end boundaries and countdown values.
  - Winter/summer timezone behavior through `Europe/Sarajevo`.
- Add component checks confirming the banner appears for admin/agent/user roles, stays hidden for clients, and cleans up its timer correctly.

## 2. Authenticated staff browser testing

Using the existing signed-in preview session, smoke-test these representative workflows without submitting external communications:

- Dashboard, order filters, direct order opening, order details, and create-order form validation/cancel flow.
- Invoices list/detail, totals, outstanding amounts, filters, and PDF preview rendering without sending.
- Offers and proposals lists/detail views, including public offer confirmation display without accepting a real offer.
- Clients, companies, customer tickets, support, inventory, reminders, work hours, analytics, settings, and social-report pages.
- Navigation, sidebar states, dialogs, dropdowns, tables, pagination, loading/empty/error states, dark mode, and browser refresh/deep links.
- Capture browser console errors, failed network requests, broken links, missing content, layout shifts, clipped text, and overlapping controls.

## 3. Break-banner live behavior

- Verify the banner across multiple staff pages by controlling browser time at all key boundaries.
- Confirm its countdown changes every second, remains correct while navigating, enters at 12:00 and 15:00, and disappears at 13:00 and 15:30.
- Confirm weekend suppression and client exclusion.
- Check that the banner does not cover the header, dialogs, menus, notifications, or mobile navigation.
- Verify reduced-motion behavior and screen-reader status semantics.

## 4. Visual-system audit

- Review representative desktop and mobile screenshots in light and dark themes.
- Check Urbanist/Epilogue font loading and fallbacks, readability, spacing, truncation, contrast, focus rings, disabled states, tables, cards, badges, forms, and modals.
- Locate pages still using legacy hardcoded gray/blue styling and distinguish harmless document-print colors from visible CRM inconsistencies.
- Check invoice/proposal previews and safe email-template renderings for consistent AB Media Team navy branding; do not deliver test emails.

## 5. Client-facing safety checks

- Verify public login, ticket submission form, offer-view states, and client portal route protection.
- Confirm the break banner is absent from every client-facing page.
- Verify client-facing pages retain readable branding in light/dark and at mobile width.
- Do not use or expose credentials and do not send messages to clients.

## 6. Fix and report

- Fix regressions directly attributable to the makeover or banner implementation, keeping all business behavior unchanged.
- Re-run affected tests after each fix, then run the full type check and test suite.
- Deliver a concise QA report listing pages tested, evidence, fixes applied, remaining pre-existing issues, and anything that could not be tested safely.
