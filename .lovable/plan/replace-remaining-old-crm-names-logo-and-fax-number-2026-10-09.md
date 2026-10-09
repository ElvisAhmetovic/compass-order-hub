# Replace remaining old CRM names, logo and fax number

## Changes
1. **Login and Register pages**: title becomes "Media Marketing LTD - CRM"; the old AB symbol is replaced by the new mountain-and-arrow logo (also inside the login card).
2. **Offer confirmation page** (link sent to clients): every "AB Media Team" (header, error messages, "Confirm Your Order with…") becomes "Media Marketing LTD".
3. **WhatsApp share text on Offers**: "here is your offer from Media Marketing LTD".
4. **Email templates**: default signatures and example text in the invoice email template manager/editor, plus the 32 "AB Media Team" lines in the email translation strings, become "Media Marketing LTD".
5. **Offer PDFs**: the fax line is replaced by "Tel: +49 203 7090 1754" (fax removed entirely).

## Not changed
- Sending email address (noreply@abm-team.com), website abm-team.com, invoices' bank details.
- Email templates already saved by users keep their text.

## Technical details
- Files: `src/pages/Login.tsx`, `src/pages/Register.tsx`, `src/components/auth/LoginForm.tsx` (use `media-marketing-symbol.png.asset.json` `.url`), `src/pages/ConfirmOffer.tsx`, `src/pages/Offers.tsx`, `src/components/invoices/EmailTemplateManager.tsx`, `EmailTemplateEditor.tsx`, `src/services/emailTranslationService.ts`, `src/utils/proposal/companyInfo.ts` + `pdfGenerator.ts` (drop fax, phone = +49 203 7090 1754).
- Verify `/login` and `/register` in the browser and check the build log.
