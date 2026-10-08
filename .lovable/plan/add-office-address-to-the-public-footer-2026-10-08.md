# Add office address to the public footer

## What
Show the office address in the shared public footer (used by the homepage and every public marketing page):

- Label (DE): "Büroadresse" / label (EN): "Office address"
- Address: Düsseldorfer Str. 32, 47051 Duisburg

It will appear in the small legal line at the bottom of the footer, alongside the company name, company number, registered address (Monomark House, London), phone and email — appended as a new separated item, so no layout rework is needed.

## How
1. `src/config/contactInfo.ts`: add an `officeAddress` field ("Düsseldorfer Str. 32, 47051 Duisburg") with a bilingual label, following the existing pattern.
2. `src/components/public/PublicSiteChrome.tsx` (`PublicFooter`): append the office-address item to the `legal` array in the footer's bottom line, using the existing dot-separator styling.
3. No changes to the Impressum, Kontakt page, CRM, or any other surface — the owner asked for the footer only. (Impressum can get the office address later if requested.)

## Verification
- Playwright check of the homepage footer in DE and EN, confirming the office address renders with the correct label in each language.
- Build clean.

## Memory
- Save the office address as a business fact in project memory (it replaces the earlier "remove Duisburg" state for the footer context specifically — the About page stays without it).
