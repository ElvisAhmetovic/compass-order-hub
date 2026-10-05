# Empria Tech homepage and SEO upgrade

## Goal
Turn the current homepage into a fuller, professional Empria Tech website for web design and Google SEO, while keeping login and registration prominent and preserving the existing bilingual experience.

## Homepage improvements
- Rename every public homepage brand reference from **Empria** to **Empria Tech**, including the header, footer, browser title, descriptions, and structured information.
- Strengthen the single H1 so it clearly names **Empria Tech** and the core offer: professional web design and Google SEO.
- Preserve one H1 only, then use ordered H2/H3 headings for each service and supporting topic.
- Expand the navigation to the richer page sections while retaining the DE/EN switch, login, registration, and mobile menu.
- Replace the icon-only service visuals with a cohesive set of original images showing responsive website work, search research, and performance analysis.
- Add richer, bilingual sections covering:
  - web design capabilities and deliverables;
  - technical, on-page, content, and local Google SEO;
  - the combined value of design and search visibility;
  - who the services are suited for;
  - a more detailed project process;
  - practical service FAQs;
  - clear registration and login calls to action.
- Keep the existing restrained Navy Trust visual language, typography, accessible contrast, reduced-motion behavior, and mobile-first layouts.
- Avoid fabricated testimonials, client logos, performance figures, awards, contact details, or project examples because none are verified in the project.

## Search and sharing foundations
- Update the static title, description, author, Open Graph, and X/Twitter text to **Empria Tech** with focused web design and Google SEO wording.
- Expand the existing JSON-LD into a valid graph for the Empria Tech organization, website, and its two real service categories, using only known facts and `https://empriatech.com`.
- Create a sitemap for the public, indexable homepage only. Exclude login, registration, private dashboards, one-time offer links, ticket flows, and customer areas.
- Add the sitemap URL to the existing crawler rules without removing its current bot allowances.
- Do not add fake language alternate URLs: German and English currently share the same URL through an on-page switch.
- Do not add a social image URL until a real absolute published image URL exists; hosting will continue providing its social preview fallback.

## Verification
- Confirm the page renders one relevant H1 and a logical heading hierarchy in both German and English.
- Check all new images load with useful alternative text.
- Verify desktop and mobile navigation, language switching, login, and registration links.
- Validate the rendered metadata, JSON-LD, sitemap response, crawler rules, and current SEO review findings.
- Confirm the preview completes without errors.

## Technical details
- Main work stays in the existing homepage and bilingual content files, with semantic tokens and existing button components.
- New bitmap visuals will be generated as project assets and imported by the homepage.
- The sitemap will use the existing static-site approach and omit `<lastmod>` because there is no authoritative page-specific update timestamp.
- After the changes pass verification, the sitemap finding can be marked fixed pending a rescan.
- The live custom domain will show these changes only after the next publish.
