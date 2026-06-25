## Add confirmation link to the offer details modal

In `src/pages/Offers.tsx`, inside the "View Offer Dialog" (around line 414), add a new "Confirmation link" field at the top of the form so workers can grab the URL to send manually via WhatsApp/Viber.

### What the user will see
A read-only field containing the full link, e.g. `https://empriatech.com/confirm-offer/<offer-id>`, with three small buttons next to it:
- **Copy** — copies link to clipboard (toast confirmation)
- **WhatsApp** — opens `https://wa.me/<phone>?text=<prefilled message + link>` in a new tab (falls back to `https://wa.me/?text=...` if no phone on file)
- **Viber** — opens `viber://forward?text=<prefilled message + link>`

Prefilled message: short greeting + the link, using the client's name and price, e.g. *"Hi {name}, here is your offer from AB Media Team: {link}"*.

### Technical notes
- Link is built as `${window.location.origin}/confirm-offer/${selectedOffer.id}` to match the existing `/confirm-offer/:offerId` route in `App.tsx`. For production this resolves to the empriatech.com domain.
- Use `navigator.clipboard.writeText` + existing `toast` hook for copy feedback.
- Phone for WhatsApp/Viber comes from `selectedOffer.client_phone`, stripped of non-digits.
- No DB/schema changes, no edge function changes, no business-logic changes — purely a UI addition inside the existing view/edit dialog.
- Resend flow (`handleResend`) creates a new offer ID; the link shown always reflects the currently viewed offer.

### Out of scope
- The "Resend" action's behavior
- Email templates
- Anything outside the View Offer Dialog
