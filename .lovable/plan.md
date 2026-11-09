# Automatic client portal accounts

## How it works today
- A client only gets a portal account when someone acts:
  - **Team:** clicks "Create client portal" on an order (dashboard) or a monthly package. The CRM creates the login, links that order and every other order with the same email, and emails the login details.
  - **Client:** on the portal login page, enters an order number to request access. The same thing happens. If they already had an account, their password is reset.
- If nobody does either, the client never sees their orders, invoices, Stripe pay links or missed payments.

## What changes
Accounts get created automatically, and each client receives their login details once.

```text
Given a new order or monthly package with a client email
When it is saved
Then a portal account exists for that email (created if missing)
And every order/package with that email is linked to it
And the client gets one "Your client portal" email (DE/EN) with login + password
  (+ "change your password after first login")

Given the client already has a portal account
When a new order or package is created for them
Then no new password is made and no password is reset
And the order simply appears in their existing portal

Given an order has no valid email, or the email belongs to a team member
Then no account is created and the team sees "No portal account created"
```

- The Stripe pay-link email and invoice emails get a line: "You can also see and pay this in your client portal" with the login link.
- The manual "Create client portal" button stays as a "Resend login details" option.
- Team members see a small "Portal: active / invited" badge on the order and package.

## Existing clients (needs your decision at build time)
Clients who already have orders but no account will **not** be emailed automatically. After the build, I'll show you the count and a list, and send their invites only after your explicit OK (one batch, throttled).

## Technical details
- New edge function `ensure-client-portal` (team JWT or service role; 401 otherwise): find-or-create auth user + `app_users` role client, bulk-link orders/contracts by email, send credentials only when the account was newly created. Reuses logic from `request-client-credentials` / `send-client-portal-credentials`, without the password reset for existing users.
- Called fire-and-forget after order creation and monthly package creation (`CreateMonthlyContractModal`, order create flow, `confirm-offer`).
- Excludes team emails (`_shared/teamEmails.ts`) and invalid emails; idempotent per email.
- Tests: rule tests (skip team/invalid emails, no reset for existing account, single email), 401 test for the function. Emails sent only to internal test address during verification.
