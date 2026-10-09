# Remove the white box behind the logo

## Why it is there
The logo is transparent. I added the white box on purpose: the logo's dark navy parts are the same colour as the site's navy header and footer, so without the box those parts would disappear and only the cyan arrow would show.

## Fix
- Make a light version of both logos for the dark site: the navy parts turn white and the cyan arrow stays cyan. The background stays fully transparent.
- Header: light symbol logo, no white box.
- Footer: light version of the logo with the "MEDIA MARKETING LTD" text, no white box.
- Invoices keep the original navy and cyan logo, because invoices are printed on white paper.
- The browser tab icon stays the original colours.

## Technical details
- Script (PIL): pixels close to navy (#062B5C-ish, low saturation/dark) → white, preserving alpha; upload both as new lovable-assets (`media-marketing-symbol-light.png`, `media-marketing-logo-text-light.png`).
- `PublicSiteChrome.tsx`: use the light assets, remove `bg-background rounded p-*` tile classes.
- Verify against the live preview asset URLs.
