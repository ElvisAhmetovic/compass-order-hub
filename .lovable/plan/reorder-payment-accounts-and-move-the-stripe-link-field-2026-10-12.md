# Reorder payment accounts and move the Stripe link field

## What changes
1. **Payment account order** (Template Settings > Payment Information checkboxes): German, Wise, Payoneer, then WEBS WORKERS LTD REVOLUT at the bottom. Defaults are unchanged (German + Revolut ticked).
2. **Stripe payment link field** moves out of the "Edit Invoice" tab. It now sits in the "Template Settings" tab, right under the payment account checkboxes in the Payment Information box.
   - It's still saved **per invoice**, the way you picked earlier. Each invoice keeps its own link, and existing links stay.
   - The address check, the button on the preview and PDF, and the button in the Send to Client email all work as before.
   - If Template Settings is opened outside a specific invoice (from the invoice list), the Stripe field is hidden, because there's no invoice to attach the link to.

## Technical details
- `constants.ts`: reorder `PAYMENT_ACCOUNT_OPTIONS` to germany, wise, payoneer, revolut. Check that the printed account order in the preview and PDF follows the same order, and keep the existing order tests passing.
- `InvoiceDetail.tsx`: remove the Stripe input block from the edit tab. Pass `stripePaymentLink` + `onStripePaymentLinkChange` (bound to `formData.stripe_payment_link`) to `InvoiceTemplateSettings`.
- `InvoiceTemplateSettings.tsx` and `PaymentInformation.tsx`: add optional props and render the input with validation under the checkboxes only when the props are provided.
- Saving stays the same: the Save Invoice button saves the link with the invoice.
