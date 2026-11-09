# Track client portal logins and usage

Record what clients do in the portal so you can see who logs in, what they use, and where they get stuck. It uses the app's built-in visitor analytics: no new accounts and no cookies of your own. Page views, visits and time on page are already counted automatically, so this only adds the important actions.

## What gets tracked
| Moment | Details recorded |
|---|---|
| Login succeeded | language (DE/EN) |
| Login failed | reason: wrong password / other |
| Password reset requested | none |
| Logout | none |
| Pay now clicked (invoice, order link, package) | type of payment |
| Invoice filter used (All / Unpaid / Paid) | which filter |
| Receipt / PDF downloaded | none |
| Package cancelled by the client | none |
| Support ticket created | none |
| Language changed in settings | new language |
| Thank-you page shown after paying | paid / confirming / not found |
| "Couldn't load" error shown | which page |

No names, emails, amounts or invoice numbers are recorded, only the type of action.

## How you'll see it
After publishing, ask me questions like "how many clients logged in this week?", "how many clicked Pay now?" or "which portal pages fail to load?" and I'll pull the numbers.

## Not included
Your goal metric, "invoices marked paid each week", is decided on the server when Stripe confirms a payment, so these portal clicks can't count it. I can add that separately if you want.

## Technical details
- Declare `window.__lovableEvents` once in `src/vite-env.d.ts`. Call `window.__lovableEvents?.track?.("project.…")` inline in the existing handlers, only on success branches: ClientLogin, ClientLayout logout, BillingParts and ClientInvoices, ClientSettings, the support create handler, PaymentThankYou, and LoadErrorCard (on mount, with a page prop).
- Events: `project.portal_login`, `project.portal_login_failed`, `project.portal_password_reset_requested`, `project.portal_logout`, `project.portal_pay_clicked`, `project.portal_invoice_filter`, `project.portal_document_downloaded`, `project.portal_package_cancelled`, `project.portal_ticket_created`, `project.portal_language_changed`, `project.payment_thank_you_viewed`, `project.portal_load_failed`.
- Register each one with catalog_upsert (closed schemas, enum strings only), then run schema_check against HEAD.
- Events only appear from the published or preview app, not from local checks.
