# Cancellation email to client when an invoice is cancelled or deleted

## Current state
- A professional cancellation email already exists (subject e.g. "Rechnung RE-2026-0042 wurde storniert", sent from Media Marketing <noreply@mediaamarketing.com>, copy to the invoice inbox, logged in the email history, in the client's language).
- Today it is only sent when an **order** is cancelled. Cancelling an invoice directly (status "Cancelled") or deleting it sends nothing.

## What changes
Given an invoice that was already sent to a client
When the team sets its status to Cancelled, or deletes it
Then a "Notify client?" window opens with the client's email, invoice number and the message
And the team clicks **Send** (client gets the storno email) or **Skip**.

- Same "ask each time" style you chose for order updates.
- Draft invoices (never sent) do not ask — the client never saw them.
- Delete: the email is sent **before** the invoice is removed, so the number and amount are still in the email; the email history keeps a record.
- No email on the invoice/client: window says so, only Skip.
- Wording: keep the existing text, tune it to read "storniert / cancelled under number X, amount Y, dated Z; no payment needed; already paid amounts will be refunded/settled" — signed Media Marketing (no LTD).

## Technical details
- Reuse `send-invoice-cancellation`; add optional `reason` and allow calling it before delete (it already loads by invoice id).
- New `InvoiceCancelNotifyDialog.tsx` wired into status change + delete in `Invoices.tsx` / `InvoiceDetail.tsx`.
- Pure helper `shouldOfferCancellationEmail(invoice)` (not draft, has recipient) with vitest; Deno test that unauthenticated calls get 401.
- Gate A + B checks; test email only to an internal address. Needs Publish to reach the team.
