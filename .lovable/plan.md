# Empria public homepage

## Goal
Create a polished public homepage for **Empria** that presents the company as a professional web design and Google SEO partner. Keep the existing application intact and make login and registration easy to find in the top navigation.

## What will be built

- Replace the signed-out root-page redirect with a real public homepage at `www.empriatech.com/`.
- Keep the current behavior for signed-in users: opening the root address sends staff to their workspace and clients to their client portal.
- Add a fixed, refined header with an Empria wordmark, section navigation, a DE/EN language switch, and prominent **Login** and **Register** actions.
- Create a visual opening section focused on Empria, web design, and Google SEO, with a strong call to start a project and a professionally generated digital-work visual.
- Build full-width sections for:
  - Web design services
  - Google SEO services
  - A clear strategy/design/growth process
  - Practical business outcomes without invented statistics or client claims
  - A final registration/contact call to action
- Add a concise footer with navigation back to the existing account pages.
- Write complete German and English homepage copy, with German shown first and an instant language switch that updates the full page.
- Ensure navigation works smoothly on desktop and mobile, including a compact mobile menu and accessible controls.

## Visual direction

- **Palette:** Navy Trust — `#0f1b3d`, `#1e3a5f`, `#3b6fa0`, `#e8edf3`, expressed through the existing semantic theme tokens.
- **Typography:** Urbanist headings with Epilogue body copy.
- **Structure:** Full-width storytelling sections, generous spacing, strong typographic hierarchy, and restrained motion.
- **Style:** Professional European digital agency; precise, confident, and minimal rather than a generic software landing page.
- Use a coherent generated visual rather than stock imagery, while keeping Empria itself visible in the first screen.

## Existing app safeguards

- Preserve `/login`, `/register`, client login, dashboards, and all authenticated routes.
- Reuse the existing design-system buttons and semantic colors.
- Do not change registration rules, authentication, customer data, invoicing, or any internal CRM function.
- Avoid publishing unsupported prices, performance guarantees, customer logos, contact details, or testimonials.

## Technical details

- Refactor the current root page so it renders the public experience only after authentication state is known.
- Keep bilingual page content in a focused homepage translation structure rather than mixing it with client-portal translations.
- Add the homepage-specific semantic surface/accent tokens and responsive motion styles to the existing theme system.
- Load the chosen web fonts through document-head links instead of the current remote CSS import.
- Update the page title, description, Open Graph text, canonical details, and Twitter card metadata for Empria web design and Google SEO in German/English-neutral wording.
- Use the existing React Router routes for login and registration links.

## Verification

- Check the signed-out homepage in German and English on desktop and mobile.
- Verify header links, language switching, mobile navigation, Login, Register, and calls to action.
- Confirm authenticated root redirects still work for staff and client roles.
- Confirm `/login` and `/register` remain unchanged and reachable.
- Check keyboard focus, reduced-motion behavior, image loading, text wrapping, metadata, and browser console errors.
