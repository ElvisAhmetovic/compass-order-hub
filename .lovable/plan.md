# Stripe button in the "Send to Client" email

## What you'll get
- If the invoice has a Stripe link, the email the client receives gets a **"Pay online with Stripe"** button under the message, whichever language template is chosen.
- The button text follows the selected email language: German "Jetzt online bezahlen mit Stripe", English "Pay online with Stripe", and each of the other template languages in its own language.
- The message templates also get a short line pointing to the button, in each language (e.g. "You can also pay conveniently online using the button below."). It only appears when a link exists.
- In the Send to Client window, a small note under the message reads "A 'Pay online with Stripe' button will be added to this email." It also shows the link so the sender can double-check it.
- Subject lines can't hold a button. The subject templates stay as they are.
- Without a link, nothing changes. The PDF attachment keeps its own clickable button.

## Not changed
- Team notification copies (they get the PDF, which has the button).
- Monthly invoices and reminder emails.

## Technical details
- `SendInvoicePDFDialog.tsx`: read `invoice.stripe_payment_link` (or the form data); show the note; append the per-language hint line to the message when the template is chosen; send `stripe_payment_link` and `language` to the function.
- `send-invoice-pdf`: accept an optional `stripe_payment_link`; server-side it must be a valid https URL; escape it and render an `<a>` button (inline styles, email-safe) with the translated label; deploy.
- Share the label translations for the email languages in the dialog's template file; the edge function receives the already-chosen label text (escaped).
- Test: the label for de/en, and the hint is added only when a link is present.
