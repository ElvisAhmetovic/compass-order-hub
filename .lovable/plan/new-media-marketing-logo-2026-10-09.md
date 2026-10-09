# New Media Marketing logo

## Where each logo goes
- **Symbol logo (mountain + arrow, no text):** invoice default company logo, homepage/public site header, browser tab icon (favicon).
- **Logo with "MEDIA MARKETING LTD" text:** public site footer.
- The old AB logo is replaced in all those places.
- CRM login/register screens keep their current logo (not part of the main site) — say if you want them switched too.

## Visibility on the dark site
The new logos are dark navy, and the site header and footer are dark navy, so they would vanish. They will sit on a small white rounded tile in the header and footer so the colours show exactly as designed.

## Invoices
- New symbol logo becomes the default Company Logo in template settings and on invoice preview/PDFs.
- Anyone still using the old AB logo is switched automatically; a custom uploaded logo stays.

## Technical details
- Upload both PNGs (already transparent) via lovable-assets: `src/assets/media-marketing-symbol.png.asset.json`, `src/assets/media-marketing-logo-text.png.asset.json`; trim empty transparent margins first.
- `PublicSiteChrome.tsx`: header uses symbol, footer uses text logo, each in a `bg-background rounded-lg p-1` tile; alt "Media Marketing LTD".
- `invoices/constants.ts`: `DEFAULT_COMPANY_LOGO` = symbol URL; add old `ab-team-symbol` URL to `LEGACY_COMPANY_LOGOS`.
- Favicon: square 64x64 padded copy to `public/favicon.png`.
