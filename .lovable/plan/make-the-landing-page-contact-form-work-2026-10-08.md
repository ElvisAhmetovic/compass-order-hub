# Make the landing-page contact form work

## Goal
Visitors should be able to submit a contact request directly on the Empria Tech landing page, without first opening a separate contact page. Valid requests should reach `kontakt@empriatech.com`, and visitors should receive a clear success or error result in German or English.

## Plan
1. Extract the existing contact form into a reusable public-site form so the landing page and `/kontakt` share the same fields, validation, privacy notice, submission states, and email delivery path.
2. Add the form to the final contact section of the landing page, replacing the current contact-page link while preserving the existing public design and bilingual experience.
3. Keep validation on both sides: browser validation for immediate field errors and the existing protected server-side validation, input limits, honeypot, HTML escaping, and approved Resend sender/recipient configuration.
4. Improve submission handling so a response is treated as successful only when the email function explicitly returns success; keep entered details available after failures so visitors can retry.
5. Add focused tests for accepted and rejected form input, then verify German and English submissions, loading/success/error states, mobile layout, the email function response, and the project build.

## Confirmed current state
- The landing page currently links visitors to `/kontakt`; it does not contain a contact form.
- `/kontakt` already has a bilingual form that invokes `send-contact-inquiry`.
- The email function validates inputs again, escapes submitted content, and sends from the verified `abm-team.com` sender to `kontakt@empriatech.com`.
- A direct invalid-input check currently returns the expected HTTP 400 response; there were no recent production calls in the available logs.

## Technical details
- Reuse one Zod schema factory and one form component to prevent the landing and contact-page versions from diverging.
- Keep `RESEND_API_KEY_ABMEDIA` server-side only and do not expose or log form contents.
- No database changes are needed.
