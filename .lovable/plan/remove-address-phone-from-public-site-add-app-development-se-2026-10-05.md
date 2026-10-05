# Remove address/phone from public site + add App Development service

## 1. Remove address and phone from public pages
- Clear the public phone and address so they no longer show in the footer of the homepage, service pages, or the contact page (and from the contact page's structured data).
- Email and AB TEAM LTD stay.
- CRM, proposals, invoices and PDFs are not touched (they keep their own company details).

## 2. New service: App Development
- New bilingual page `/app-entwicklung` (DE "App-Entwicklung", EN "App Development"), same layout as Webdesign/SEO/Digital Marketing: hero, overview, capabilities (web apps, iOS/Android apps, customer portals, integrations/APIs, maintenance), deliverables, process, outcomes, FAQ, related services, CTA.
- New original generated image for the page.
- Linked from the homepage services section, the header/mobile menu, the footer, and related-service cards.
- Added to sitemap and homepage structured data list of services.
- No fabricated clients, prices or case studies.

## Technical details
- `src/config/contactInfo.ts`: phone "" and address empty; footer/contact already hide empty values (make address conditional on ContactPage).
- Add `appDevelopment` key in `src/content/servicePages.ts`, route in `src/App.tsx`, nav entry in `PublicSiteChrome.tsx`, ServiceBlock in `Index.tsx`/`homepage.ts`, `public/sitemap.xml`, `index.html` ItemList.
