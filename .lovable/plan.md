# Resolved orders: "service completed" text in payment reminders

## Goal
Automatic payment reminders for invoices whose order is marked **Resolved** add a short paragraph near the top saying the service has been fully completed, so the outstanding amount is now due.

## Proposed wording (approved style, no threats)
- **English:** "We are pleased to confirm that the service for this order has been fully completed and resolved. As all work has now been delivered, the outstanding invoice amount of {amount} is due for payment. We kindly ask you to settle it as soon as possible."
- **German:** "Wir freuen uns, Ihnen mitzuteilen, dass die Leistung zu diesem Auftrag vollständig erbracht und abgeschlossen wurde. Da alle Arbeiten nun geliefert sind, ist der offene Rechnungsbetrag von {amount} zur Zahlung fällig. Wir bitten Sie, diesen so bald wie möglich zu begleichen."
- Other reminder languages (Dutch, French, Spanish, Danish, Norwegian, Czech, Polish, Swedish) get my own translation of the same text. A native speaker should check them.

## Behaviour
- Added only when the linked order is Resolved and not paid or cancelled. Other reminders stay exactly as they are.
- The paragraph goes after the greeting and before the existing approved reminder text. The rest of the email, the subject and the signature don't change.
- Monthly-package invoices (no order) are unaffected.

## Technical details
- `supabase/functions/send-invoice-payment-reminders/index.ts`: add `resolvedNotice: Record<lang,string>`; pass `isResolved = order?.status_resolved === true` into `buildReminderEmailHtml` and render the notice for client emails. Redeploy, then send a test reminder (existing `test_email` mode with a resolved flag) to invoice@mediaamarketing.com.
- Mirror the EN/DE text in `src/services/paymentReminderCopy.ts` (per the shared-reminder-copy rule) and add a test that both languages contain the notice text.
