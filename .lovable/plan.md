## Problem

Clicking "Invoice" on the LogisGreen Bordeaux order fails with "Failed to create invoice."

Root cause: `createInvoiceFromOrder` in `src/components/dashboard/OrderRow.tsx` looks up the client only by exact `name === order.company_name`. The order's company name is `Entreprise de nettoyage Bordeaux - société LogisGreen`, but the existing client is named `LOGISGREEN` and already owns the email `logisgreensocietedenettoyage@gmail.com`. So the lookup misses, and `createClient` then fails with a duplicate-email error (Postgres 23505) — surfaced as the generic toast.

This violates the project's standard client-matching rule (name+email exact, fallback to email-only).

## Fix

In `src/components/dashboard/OrderRow.tsx` `createInvoiceFromOrder`, update the client resolution to:

1. Try exact match on `name === order.company_name` AND `email === order.contact_email` (case-insensitive).
2. Fallback to email-only match (case-insensitive).
3. Only create a new client if neither matches.

Apply the same fix in `src/components/dashboard/OrderActions.tsx` (which has an identical pattern and the same error toast).

No schema changes, no UI changes — just smarter client lookup so the invoice creation reuses the existing client record instead of triggering a duplicate-email insert.

## Verification

- Re-trigger "Invoice" on the Bordeaux order → expect an invoice to be created and linked to the existing `LOGISGREEN` client.
- Existing LOGISGREEN orders (exact name match) still resolve correctly.
