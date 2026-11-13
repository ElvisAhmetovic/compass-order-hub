# Ask "Notify client?" after saving an order

## Spec
- Given a team member edits an order and clicks Save
- When the save works
- Then a "Notify client?" window opens showing:
  - who it goes to (the order's contact email)
  - a short, editable message, filled in with the Client Update text if there is one, otherwise a neutral "Your order was updated" line
  - the language (DE/EN)
- They can choose **Send** (the email goes to the client) or **Skip** (nothing is sent).
- Internal notes and the price are never put in the client email.
- If the order has no client email, the window says so and only Skip is available.
- Sending is logged in the order history.

## Technical
- After `onSaved` in `useOrderEdit.ts`, open a new `NotifyClientDialog`. The team email stays as it is.
- Send through an existing client-email edge function if one fits (check `ClientAccessSection` "Send Update"); otherwise add `send-client-order-update`, which checks for team users and sends from Media Marketing <noreply@mediaamarketing.com> via `RESEND_API_KEY_ABMEDIA`, fire-and-forget.
- Pure helper `buildClientUpdateEmail(order, message, lang)` that leaves out internal notes, with a vitest for it.
- Test emails go to internal addresses only.
