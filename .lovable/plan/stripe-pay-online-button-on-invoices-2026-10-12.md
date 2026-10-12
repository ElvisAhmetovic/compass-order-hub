# Stripe "Pay online" button on invoices

## What you'll get
- A new field on the Edit Invoice page, under the service dates: **"Stripe payment link (optional)"**. Paste any Stripe link, for example a payment link for that invoice's amount.
- The link is saved with that invoice, so every colleague sees the same one, and other invoices are unaffected.
- When a link is filled in, the invoice preview and the PDF show a **"Pay online with Stripe"** button under the bank details. Clicking it opens your Stripe page. Bank details stay as they are, so clients can still pay by transfer.
- When the field is empty, no button appears.
- Only proper web links (starting with https://) are accepted, and a warning shows otherwise.
- The button text follows the invoice language (German: "Jetzt online bezahlen mit Stripe", English: "Pay online with Stripe"; other languages use English).

## Not changed
- Monthly invoices, offers and reminder emails.
- No Stripe account connection is needed; it's just your link.

## Technical details
- Migration: `invoices.stripe_payment_link text` (nullable); extend `update_invoice_with_lines` to accept the key. Re-apply grants after the function is replaced (authenticated + service_role).
- `types/invoice.ts`, `invoiceService` create/update, `InvoiceDetail.tsx` form field with `https://` validation.
- `InvoicePreview.tsx`: `<a target="_blank" rel="noopener">` button.
- `invoicePdfGenerator.ts`: render the button and record its position. The PDF is made from an image, so add a clickable area over the button with jsPDF `pdf.link(x, y, w, h, { url })`, so it really clicks in the PDF (download and send-to-client).
- Small helper `isValidPaymentLink()` plus a test: https accepted; http, `javascript:` and empty values rejected.
