# Remove the two legal numbers from the AB Media website

## Scope
- Update the **abmedia-official-id / myreviewmedia.com** website shown in the screenshot.
- Remove only these two lines from the footer:
  - `Betriebsnummer: 10750003655`
  - `USt-IdNr: DE 7909418491`
- Remove the same two details from the Impressum page so they do not remain elsewhere on the website.
- Keep all other company, director, registration, contact, and legal information unchanged.

## Verification
- Confirm neither number remains in the website source.
- Check the footer and Impressum page on desktop and mobile for clean spacing after removal.

## Technical details
The matching text is in `Footer.tsx` and `Impressum.tsx` within the separate **abmedia-official-id** project. This CRM project does not contain those values, so the change must be applied in that website project.
