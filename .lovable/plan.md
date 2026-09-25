# Fix the "Send Invoice" window on the Edit Invoice page

## What is broken today
The Send Invoice button on the edit invoice page opens an older window, not the one used in the invoice preview:
- It sends through a mail service that does not exist, so **no email ever reaches the client**.
- It still shows "Invoice sent" and marks the invoice as sent and the order as "Invoice Sent" — a false success.
- It sends no PDF attachment.
- Its text is the old English-only message, without the new bank notice or the 10 languages.
- The "payment links" tab depends on online payments that were never set up, so it fails too.

## The fix
1. Make the edit invoice Send Invoice button open the **same working window as the preview** (new bank notice text, 10 languages, PDF attached, sent from noreply@abm-team.com, team gets a copy).
2. Mark the invoice as sent / update the order **only after the email is actually delivered**; show a clear error if sending fails.
3. Remove the old broken window and its dead mail call so it can't come back.
4. The PDF is built from the invoice exactly as saved; if there are unsaved edits, you'll be asked to save first so the client never gets an outdated PDF.

## QA
- Open the window from the edit page and the preview: same subject/message, language switching works, fields stay editable, PDF is created.
- Check that failed sends show an error and don't change status.
- Check automated tests and type checks pass.
- No real client emails during testing.

## Technical details
- `InvoiceDetail.tsx`: route `sendDialogOpen` to `SendInvoicePDFDialog` (pass the PDF generator already used by the preview); delete `SendInvoiceDialog.tsx` and `EmailService.sendInvoiceEmail` (calls nonexistent `send-invoice-email`).
- In `SendInvoicePDFDialog`, await `send-invoice-pdf` and only then update `invoices` status / `next_reminder_at` and `toggleOrderStatus`.
- Dirty-form guard before generating the PDF on the edit page.
