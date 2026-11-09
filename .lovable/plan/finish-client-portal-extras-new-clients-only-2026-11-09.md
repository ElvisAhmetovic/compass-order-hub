# Finish client portal extras (new clients only)

Existing clients: no emails will be sent. Only clients created from now on get login details automatically (already how it works).

## Behaviour (Given/When/Then)
- Given an order or monthly package whose client email has a portal account, when the team views the list, then it shows a green "Portal: active" label.
- Given the client was sent login details but has never signed in, then it shows "Portal: invited".
- Given no portal account exists, then it shows "No portal" plus the button, now named "Resend login details" / "Create portal access".
- Given a Stripe subscription link email or an invoice email is sent, then it contains one line: "You can also see this invoice and pay it in your client portal: www.empriatech.com/client/login" (German version for German clients).
- Given a new client account is created, then the login email is in German and English (German first), with portal link, email and password.
- Existing 570 clients: nothing is emailed.

## What changes
1. Portal label on order rows and package rows, based on the client's account and last sign-in.
2. Portal line added to the Stripe link email and the invoice email (DE/EN, matching the email's language).
3. Login email rewritten bilingual, "Media Marketing" branding, sender noreply@mediaamarketing.com.
4. Manual portal button renamed so it's clear it resends details.

## Technical details
- Status lookup: small read-only helper querying `app_users`/`profiles` by email (batched per list page); "invited" vs "active" from last sign-in, via a security-definer function if auth data is needed.
- Edit `send-client-portal-credentials`, `send-invoice-pdf`, and the email part of `stripe-billing`; shared copy in `supabase/functions/_shared/portalEmailCopy.ts`.
- UI: `OrderRow.tsx`, `MonthlyInstallmentsTable.tsx` (and package list), `CreateClientPortalModal.tsx` labels.
- Tests: label rule (active/invited/none), portal line present in both languages; Gate A checks; no live emails sent, test only to internal address with OK.
