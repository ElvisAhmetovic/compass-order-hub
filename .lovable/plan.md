# New address + Impressum and Datenschutz pages

## 1. New public address
- Show "Düsseldorfer Str. 32, 47051 Duisburg, Deutschland" (EN: "..., Germany") in the public footer and on the contact page.
- Phone stays hidden. CRM, proposals, invoices and PDFs are not changed.

## 2. Impressum page (`/impressum`)
- German legal notice (with English translation via the DE/EN switch) following the usual German structure (§ 5 DDG):
  - Company: AB TEAM LTD, Düsseldorfer Str. 32, 47051 Duisburg
  - Email: kontakt@empriatech.com
  - Represented by, register court and number, VAT ID, phone, person responsible for content: "Angaben folgen in Kürze" / "Information coming soon"
  - Standard sections: EU online dispute resolution note, consumer arbitration statement, liability for content and links, copyright.
  - Short description of the business: web design, Google SEO, digital marketing, app development.

## 3. Datenschutz page (`/datenschutz`)
- General GDPR privacy policy (German, with English translation), covering:
  - Controller (AB TEAM LTD details as above), data protection officer: "coming soon"
  - Hosting and server log files
  - Contact form and email inquiries (data sent by email, used only to answer)
  - User accounts / login and client area
  - Fonts loaded from Google Fonts
  - Language preference saved in the browser (no tracking cookies)
  - Legal bases, retention, user rights (access, deletion, objection, complaint to a supervisory authority), SSL encryption, changes to this policy
- Anything specific we don't know (hosting provider details, any extra tools) marked "Angaben folgen in Kürze".

## 4. Linking
- "Impressum" and "Datenschutz" links in the footer of every public page.
- Contact form gets a short privacy note linking to Datenschutz.
- Both pages added to the sitemap.

## Note
These are general templates, not legal advice. A lawyer should check them before you rely on them.

## Technical details
- `src/config/contactInfo.ts`: set address de/en.
- New `src/content/legalPages.ts` (bilingual copy) and `src/pages/LegalPage.tsx` (shared layout using PublicHeader/PublicFooter, Helmet title/description/canonical, one H1).
- Routes in `src/App.tsx`; footer links in `PublicSiteChrome.tsx`; sitemap entries (yearly, 0.3).
