# Finish the invoice cleanup: old contact name, UID, Gmail and old logo

## What I checked
- Your shared company settings in the database are already correct: Media Marketing Limited, contact person and director Annalena Klein, no UID number, no email.
- The screenshot was taken before this morning's fix, and that fix only goes live when you publish. It showed Andreas Berger, UID 13426 27369 and kontakt.abmedia@gmail.com because the invoice screen read your colleague's old saved copy in the browser.
- After the fix, the invoice edit page, preview, download and send all take company details from the shared settings, so those lines will no longer appear.
- **One gap is still open:** the logo in the screenshot (purple "AB MEDIA TEAM" magnifier) is a second old logo file that isn't on the "replace automatically" list. A colleague with that logo saved would still see it.

## Fix
1. Add the second old AB Media Team logo file to the list of old logos. The check recognises a logo by its file name, so it still matches if the logo was saved with the full web address. Any old logo is replaced by the new Media Marketing logo.
2. Add a check so this exact case (old contact person, UID, Gmail, old logo saved in the browser) comes out as Annalena Klein, no UID, no email and the new logo.
3. Publish, then have the colleague reload an invoice made from an order and open Preview.

## Technical details
- `src/components/invoices/constants.ts`: add `/lovable-uploads/2d4259f4-7fb1-4221-9e23-4bec4378d055.png` to `LEGACY_COMPANY_LOGOS`. Add an `isLegacyLogo(url)` helper that matches by filename and use it in `loadTemplateSettings.ts` and `useInvoiceSettings.ts`.
- Extend `__tests__/loadTemplateSettings.test.ts` with the stale-companyInfo case from the screenshot.
