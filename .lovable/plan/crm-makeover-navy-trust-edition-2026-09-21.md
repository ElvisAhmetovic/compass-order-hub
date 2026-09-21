# CRM Makeover — Navy Trust Edition

A full visual refresh of the CRM. Structure and features stay exactly as they are — this is presentation only, no behavior, data, or workflow changes.

## Locked design choices

- **Palette:** Navy Trust — `#0f1b3d` (deep navy), `#1e3a5f` (mid navy), `#3b6fa0` (steel blue accent), `#e8edf3` (ice). Light theme as the default; dark mode tokens updated to match.
- **Typography:** Urbanist for headings, Epilogue for body (Google Fonts).
- **Layout:** refined dashboard-panels — same sidebar + panel structure as today, polished.

## What changes

### 1. Design tokens (foundation)

- `src/index.css`: replace the color tokens with Navy Trust values (background, card, sidebar, primary, accent, muted, borders), plus matching shadows, radius scale, and gradients. Add Urbanist + Epilogue font imports and font-family tokens.
- `tailwind.config.ts`: register the new tokens and font families.

### 2. App shell + dashboard

- Sidebar: deep navy surface, ice text, steel-blue active state, cleaner section grouping.
- Top bar and page headers: consistent title sizes in Urbanist, subtler borders.
- Dashboard panels (orders table, Finance cards, Needs-attention card): restyled with the new tokens — crisper card borders, refined badges/chips for order statuses, better spacing.
- Shared UI polish: buttons, inputs, dialogs, tables, tabs, toasts — restyle through the existing shadcn variants so every page inherits the look.

### 3. Team pages

- Invoices, Offers, Clients, Reminders, Work Hours, Tickets, Reports, Settings: these inherit the new tokens automatically; targeted touch-ups where hardcoded colors exist (replaced with tokens).

### 4. Client-facing pages

- Login pages (team + client portal), offer confirmation page, client portal: same Navy Trust treatment so clients see one consistent brand.

### 5. Documents & emails

- PDF generator (invoices/offers): navy header band, Urbanist-style heading treatment, steel-blue accents, keeps AB MEDIA TEAM LTD and all content identical.
- Email templates (offer, invoice, reminder, review request, notifications): navy header with logo, ice background, steel-blue buttons — same wording, new look.

## What does NOT change

- No layout restructuring — pages keep their current structure and workflows.
- No behavior, data, email-copy, or permission changes. No emails sent during testing.

## Verification

- Typecheck + full test suite.
- Visual pass via Playwright on: dashboard, invoices, offer confirmation page, client login, and one email/PDF render. DO NOT BREAK FUNCTIONALITY OF SITE.

## Technical notes

- All colors go through semantic tokens — no hardcoded hex in components.
- Fonts loaded from Google Fonts with system fallbacks; self-hosting can be a follow-up if we want zero external requests.