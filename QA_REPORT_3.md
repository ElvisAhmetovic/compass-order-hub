# CRM QA Report — Visual Refresh and Work-Break Banner

## Scope

Non-destructive QA of the Navy Trust visual refresh, work-break banner, public/client entry points, route protection, and related email configuration. No client emails were sent and no production records were changed.

## Automated verification

- TypeScript application check: passed.
- Vitest: 123 tests passed across two files.
- Added 20 focused work-break checks covering:
  - exact start/end boundaries for both breaks;
  - Sarajevo summer and winter offsets;
  - Saturday and Sunday exclusion;
  - countdown formatting and zero clamping;
  - staff/admin/worker visibility;
  - client exclusion;
  - interval cleanup on unmount.

## Browser verification

Checked `/login`, `/client/login`, malformed ticket links, invalid offer links, and the 404 page in:

- desktop light mode;
- mobile light mode at 390px;
- desktop dark mode.

Results: no page crashes, failed browser requests, JavaScript page errors, or horizontal overflow. Authenticated screens could not be exercised because preview authentication is externally managed and redirected to login.

## Fixes applied

1. Replaced remaining shared Header/Layout legacy gray classes with semantic Navy Trust tokens.
2. Updated staff login, registration, loading, and 404 presentation to semantic light/dark tokens.
3. Replaced stale “Order Flow Compass” entry-page branding with “AB Media Team CRM”.
4. Removed the duplicated registration prompt on the staff login page.
5. Changed the global browser title to “AB Media Team CRM”.
6. Made malformed ticket links render a clear invalid-request page instead of a blank screen.
7. Hid internal edge-function error text from clients opening invalid offer links.
8. Added `AdminGuard` to admin work-hours and invoice-audit routes.
9. Prevented the one-second countdown from being announced by screen readers every second while retaining one polite break-start announcement.

## Email/configuration audit

- No retired `empriadental.de` sender references were found.
- No `noreply@empriatech.com` sender references were found.
- Verified `noreply@abm-team.com` references remain in the email functions.
- Some older functions retain `RESEND_API_KEY` only as a fallback after `RESEND_API_KEY_ABMEDIA`; this works but should eventually be standardized.

## Remaining non-blocking work

- Authenticated browser QA still needs an approved managed test session; credentials should not be placed in source or logs.
- Invoice/proposal PDF generators retain older printable palettes and default PDF fonts. Their calculations were not changed.
- Several less-used email templates retain older visual palettes. Delivery configuration remains valid.
- Automated workflow coverage remains limited outside invoice translations and the new banner suite. Highest-value next tests are offer acceptance idempotency, invoice/VAT totals, partial-payment reminders, and client ownership/RLS checks.