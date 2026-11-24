# Assistant: chat bubble + the missing actions

## Why those parts were left out
- **Invoices and PDFs:** invoice PDFs are drawn inside the browser on the Invoices page, not on the server where the assistant runs. Copying that PDF logic risked invoices that look different or show different bank details. That breaks the rule that every PDF carries the same payment details.
- **Emailing invoices:** sending needs the PDF first, so it depended on the point above.
- **New support tickets:** it was scoped to updating tickets only. It was left out to keep the first version small.
- **Stripe-paid packages:** stopping them needs Stripe itself to cancel the subscription. Otherwise Stripe keeps charging the client.
- **Deleting and refunds:** you can't undo these. Leaving them out was a safety choice, not a technical limit.

## What we build now
1. **Chat bubble on every team page.** A round button sits in the bottom-right corner, for admins only. Clicking it opens a chat box with the same assistant, saved conversations and Confirm cards. The box has buttons to start a new chat, pick a recent chat, open the full Assistant page and close the box. The chat you have open stays open when you move to another page. The bubble is hidden on the full Assistant page and on public and client portal pages.
2. **Create invoices.** The assistant proposes "create invoice for order X" and you click Confirm. It uses the same invoice numbering as the Invoices page.
3. **PDF and email an invoice.** After you confirm, the chat card shows a **Download PDF** and a **Send to client** button. These buttons use the existing invoice PDF and send window, so bank details stay identical everywhere.
4. **Create support tickets.** The assistant proposes a new ticket and creates it after you click Confirm.
5. **Stripe-paid packages.** Stopping one goes through the existing Stripe billing function after you click Confirm, so Stripe stops charging too.
6. **Still not allowed:** deleting records and Stripe refunds.

## Acceptance (Given/When/Then)
- Given I'm an admin on any team page, when I click the bubble, then the chat opens and keeps my conversation when I change pages.
- Given a client or portal user, then no bubble appears.
- Given I ask "create invoice for order X", then nothing is saved until I click Confirm, and then an invoice with the next number exists.
- Given a Stripe-billed package, when I confirm stop, then Stripe stops the subscription and the package shows as stopped.

## Technical details
- New `src/components/assistant/AssistantBubble.tsx` mounted once in the authenticated layout (admin check, hidden on `/assistant*`). Extract the shared chat panel from `AdminAssistant.tsx` into `AssistantChat.tsx`, used by both the page and the bubble.
- New write tools in `_shared/assistantRules.ts`: `create_invoice`, `create_support_ticket`, `stop_stripe_package`. Execute them in `admin-assistant-confirm`, reusing the existing invoice-number logic, the ticket insert and the `stripe-billing` cancel action.
- PDF and send actions on the result card reuse the existing browser PDF generator and `SendInvoicePDFDialog`, so no second PDF implementation is added.
- Tests: rule tests for the new tools needing confirmation, plus 401/403 tests stay green. Run Gate A, then Gate B (money changes).
