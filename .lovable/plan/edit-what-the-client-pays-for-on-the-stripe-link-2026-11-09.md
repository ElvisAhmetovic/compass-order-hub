# Edit what the client pays for on the Stripe link

## What changes
Clicking **Stripe link** (or **Resend Stripe link**) on a package opens a small window instead of sending right away:

- **Product name** (required, max 120 characters): what the client sees on the Stripe payment page, receipts and Stripe invoices. It starts filled with the current text (client name – website). Example: "SEO Paket Premium – monatlich".
- **Short description** (optional, max 300 characters): extra line shown under the name on the payment page.
- A preview of the price per period (read-only).
- Buttons: **Cancel** / **Send link to client**.

The text is saved on the package, so a resend starts with the same wording. The **Pay by Stripe subscription** switch in the new-package form also gets the same two fields.

Already-active subscriptions keep their current name. A new name only applies to links sent from now on.

## Rules (Given/When/Then)
- Given a package without a saved name, when I open the window, then the name field is prefilled with "client name – website".
- Given I type "SEO Paket Premium", when I send, then the Stripe payment page and receipts show "SEO Paket Premium".
- Given an empty name, when I press send, then it is blocked with "Product name is required".
- Given a name was saved earlier, when I resend, then the field shows that saved name.

## Technical details
- Migration: `monthly_contracts` add `stripe_product_name text`, `stripe_product_description text`.
- `stripe-billing` `create_checkout`: accept optional `product_name` (1–120) and `product_description` (≤300) via zod; save to the contract; use them in `price_data.product_data.name/description`, falling back to the saved value, then to the default.
- New `StripeLinkDialog.tsx` used by `StripeContractControls`; create modal gains the two inputs when the switch is on.
- Tests: Deno test for the name fallback helper; vitest for the dialog's required-name validation. Gate A: eslint, typecheck, deploy, 401 check.
