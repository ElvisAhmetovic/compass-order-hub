# Order cancelled: cancel invoice and email the client

## Already working
Marking an order **Cancelled** already cancels its unpaid invoice, stops its reminders, and now shows the red X with the date. Paid or refunded invoices are left alone. Nothing changes there.

## New: cancellation email to the client
When an order is marked Cancelled and an unpaid invoice was cancelled because of it, the client gets one short email:

- **Subject:** "Invoice INV-2026-xxxx has been cancelled" / "Rechnung INV-2026-xxxx wurde storniert"
- **Message:** the order and invoice have been cancelled, the invoice no longer needs to be paid, and no further reminders will be sent. Contact invoice@mediaamarketing.com with any questions.
- **Sign-off:** the standard Media Marketing LTD signature (Annalena Klein, phone, invoice@mediaamarketing.com, Duisburg address).
- **Sender:** Media Marketing LTD <noreply@mediaamarketing.com>; a copy goes to invoice@mediaamarketing.com.
- **Language:** the invoice's language (German, English, and the other invoice languages; non-English/German texts are my translations).
- **Sent only once** per cancellation. Not sent if the order had no unpaid invoice, if the client turned off automatic emails, or if there is no client email.
- Undoing the cancellation does not send anything.
- The team sees a short note "Cancellation email sent to client" after marking Cancelled. If the email fails, the cancellation still goes through and the team is told.

## Technical details
- New edge function `send-invoice-cancellation` (Resend, `RESEND_API_KEY_ABMEDIA`, CORS, verify_jwt true): input invoice_id; loads invoice + client; respects `clients.auto_reminders_enabled`; localized copy per `invoices.language`; logs to `client_email_logs` (template_name `invoice_cancellation`).
- `src/services/orderService.ts`, Cancelled-enable branch: after each invoice is auto-cancelled, fire-and-forget invoke the function; toast result.
- Add a small test for the "send only for invoices cancelled by this order and not paid/refunded" rule.
