Update the static social/link preview in `index.html` so shared links from the app show AB Media Team branding instead of the generic Lovable defaults.

## What we will change

- Replace the current `<title>`, `description`, `og:title`, `og:description`, `twitter:title`, and `twitter:description` with the AB Media Team branded text.
- Set the preview image to the existing AB Media Team logo already in `public/lovable-uploads/2d4259f4-7fb1-4221-9e23-4bec4378d055.png` using an absolute `https://` URL so WhatsApp/Facebook/Twitter can fetch it.
- Add a matching `og:url` (pointing to the published app URL) and keep `og:type` as `website`.
- Since the requested scope is **all links**, this will be the new sitewide default preview shown for every shared URL from the app.

## Exact target values

- Title: `AB Media Team - Confirm your offer`
- Description: `Review and confirm your offer from AB Media Team.`
- Image: `https://www.empriatech.com/lovable-uploads/2d4259f4-7fb1-4221-9e23-4bec4378d055.png`
- `og:url`: `https://compass-order-hub.lovable.app/`

## Important note

This is a static Vite/React SPA. Social crawlers (including WhatsApp) read the tags from `index.html` at request time and do **not** execute JavaScript, so dynamic per-offer previews (e.g. changing the title for each client/order) are not possible on this stack without upgrading to SSR. The change above will make every shared link look consistent and branded. If you later need per-offer title/description, you would need to migrate to the TanStack Start (SSR) template.

## Files to edit

- `index.html` (only file changed)
