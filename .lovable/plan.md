# Bilingual Empria Tech service pages

## Goal
Create three complete public service pages for Web Design, Google SEO, and Digital Marketing, connect them clearly from the homepage, and make each page useful to visitors and discoverable by search engines in both German and English.

## Public pages
Add these indexable routes:
- `/webdesign`
- `/google-seo`
- `/digital-marketing`

Each page will include:
- one focused H1 naming the service and its business value;
- a strong visual hero using Empria Tech’s existing visual direction;
- an overview of the service and who it is for;
- detailed deliverables and capabilities;
- a service-specific process;
- expected outcomes described without unsupported guarantees;
- related-service links to the other two pages;
- service-specific FAQs;
- registration and login calls to action.

## Bilingual experience
- Keep German as the default and English as the alternate language through the existing language switch.
- Share the saved language preference across the homepage and all three service pages.
- Write complete, natural German and English content for every section, navigation label, image description, FAQ, and action.
- Keep each route language-neutral because both languages are presented on the same URL; do not add misleading language alternate URLs.

## Homepage integration
- Turn the Web Design and Google SEO service areas into clear links to their dedicated pages.
- Add Digital Marketing as a third full service offering with its own image, summary, capabilities, and page link.
- Update the header and mobile navigation so visitors can reach all three services directly.
- Add related links in the footer while preserving the prominent login and registration actions.

## Visual and interaction system
- Reuse the current Navy Trust palette, Urbanist/Epilogue typography, spacing, buttons, and restrained editorial photography.
- Build shared public-site header, footer, language switch, service page layout, and section components so all pages remain consistent.
- Reuse the approved Web Design and SEO imagery and create one matching original Digital Marketing image.
- Keep image dimensions stable, add descriptive alternative text, lazy-load non-hero images, and preserve reduced-motion behavior.
- Verify desktop and mobile layouts, menus, language switching, internal links, and readable content hierarchy.

## Search and page information
- Add route-specific titles, descriptions, canonical URLs, Open Graph text, and Service JSON-LD for all three pages.
- Keep the homepage’s existing static social fallback while adding route-specific information for search engines that render the pages.
- Update the existing organization/service structured information to include Digital Marketing and point each service to its dedicated URL.
- Expand the sitemap from the homepage to all four public marketing pages, without synthetic `<lastmod>` dates.
- Keep login, registration, dashboards, one-time offer links, ticket flows, and customer areas out of the sitemap.
- Keep crawler rules pointing to the sitemap.

## Content boundaries
- Describe Digital Marketing through practical areas such as channel strategy, campaign planning, content, social presence, landing pages, measurement, and iterative optimization.
- Do not invent client names, testimonials, case studies, awards, prices, performance statistics, locations, contact details, or guaranteed rankings/results.

## Technical details
- Add a reusable service-page content model and shared public-site components instead of duplicating three large pages.
- Add the three routes to the existing router.
- Use route-level head management for page-specific search metadata and structured information; the homepage remains the static fallback for non-JavaScript social crawlers.
- Update the project architecture rule to keep public marketing routes distinct from authenticated CRM and client areas.

## Verification
- Confirm each route returns and renders correctly with exactly one H1 and logical H2/H3 structure in German and English.
- Confirm all homepage and cross-service links reach the intended page.
- Validate every page’s canonical URL, title, description, and JSON-LD.
- Validate the sitemap and crawler rules.
- Check all images, desktop/mobile layouts, and preview logs for errors.
