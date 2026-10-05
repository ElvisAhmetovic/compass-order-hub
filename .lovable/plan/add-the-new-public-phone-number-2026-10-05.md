# Add the new public phone number

## Changes
- Set the public Empria Tech phone number to **+49 203 70907342** in the shared public contact details.
- Display it as a clickable phone link in the footer across the homepage, About page, all service pages, Contact page, Impressum, and Datenschutz pages.
- Replace the current “information coming soon” phone entry in the German and English Impressum with the real number.
- Add the phone number to the Datenschutz controller/contact details in both languages.
- Add the phone number to the public Organization structured data so search engines receive the same contact information.
- Keep the CRM, client portal, invoices, proposals, PDFs, reminders, and internal company settings unchanged.

## Verification
- Check the homepage, Contact, Impressum, and Datenschutz pages in German and English.
- Confirm the visible number and all `tel:` links use the new number.
- Confirm there are no build or browser errors.

## Technical details
- Use `src/config/contactInfo.ts` as the single source for the public number.
- Reference that shared value from legal-page copy and public structured data to prevent future inconsistencies.
