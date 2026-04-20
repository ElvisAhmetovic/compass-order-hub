

## Add Language Selector for Offer Email

### What
Add a language dropdown next to/under the "Send Offer" button in `CreateOrderModal`, with 11 EU languages. The selected language is passed to `send-offer-email` and used to render the offer email content (headlines, button label, greeting, body, footer) in that language.

### Languages
English (en), German (de), Dutch (nl), French (fr), Spanish (es), Italian (it), Czech (cs), Polish (pl), Swedish (sv), Norwegian (no), Danish (da). Default: English.

### How
**Frontend — `src/components/dashboard/CreateOrderModal.tsx`**
- Add `offerLanguage` state (default `"en"`).
- Render a compact `Select` next to the "Send Offer" button (label: "Offer language") with the 11 options.
- Include `language: offerLanguage` in the `send-offer-email` invoke body.

**Backend — `supabase/functions/send-offer-email/index.ts`**
- Add a `translations` map keyed by language code containing all customer-facing strings:
  - Subject prefix: "Your Offer from AB Media Team"
  - Header tag: "Service Offer"
  - Headline: "You have received an offer from AB Media Team"
  - Price label
  - CTA button: "Confirm Your Order"
  - Greeting: "Dear {name},"
  - Body paragraph + trust line
  - Footer "Best regards"
- Read `language` from request body (default `"en"`), look up strings, and inject into `buildOfferEmailHtml`.
- Localize the email subject as well (sent to client only — team copy keeps `[Team Copy]` prefix in English for internal consistency).
- Set `<html lang="...">` to the chosen code.

### Files to modify
1. `src/components/dashboard/CreateOrderModal.tsx` — add Select + state + pass `language` to invoke
2. `supabase/functions/send-offer-email/index.ts` — add translations, accept `language` param, localize HTML + subject (then redeploy)

