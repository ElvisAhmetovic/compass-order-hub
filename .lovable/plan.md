# Remove bank details from the "Send to Client" email templates

## What changes
- On an invoice, the message templates under **Send to Client** (all 10 languages) no longer contain the "Important payment information" block with the German and Revolut IBAN/BIC/bank lines.
- The message keeps the greeting, "thank you for your order", "invoice attached", the closing and the signature.
- If the invoice has a Stripe link, the Stripe hint line and the **"Pay online with Stripe"** button stay. That is the only payment option in the email.
- Bank details still appear on the attached invoice PDF, based on the tick boxes, so clients can still pay by transfer.

## Not changed
- The monthly-package "send invoice" window and the automatic monthly emails. They share the same texts today and keep listing the bank details. Tell me if those should drop them too.
- Subject templates.

## Worth knowing (not changing unless you say so)
These templates still say "please pay within 3 days", which clashes with the due date on the invoice (usually 30 days). I can replace it with "by the due date stated on the invoice" in all languages if you want.

## Technical details
- `monthlyInvoiceTemplates.ts`: add `stripBankDetails(message)`, which removes the payment-info block (from the "payment information" heading through the last `Bank:` line) in each language. Also add `getClientInvoiceEmailTemplate(lang)` and `CLIENT_MESSAGE_TEMPLATES`, derived from the existing texts, so the monthly ones stay untouched.
- `SendInvoicePDFDialog.tsx`: use the new client templates for the initial message, a language change and a template pick (the Stripe hint is still appended).
- Tests: no client template in any language contains "IBAN", "BIC", "DE91" or "REVO", while the greeting and signature remain. The monthly templates are unchanged, and the dialog message with a link has the hint but no IBAN.
