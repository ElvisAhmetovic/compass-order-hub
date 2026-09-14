# Full CRM Functional Specification & Architecture Analysis

Produce a complete, deep functional specification of the CRM as a set of documents a new team can build from. No application code changes — documentation only.

## What gets created

**1. `SYSTEM_SPEC.md` (project root)** — the main document, structured as:

- **Module inventory** — every module (Clients/Companies, Offers, Proposals, Orders, Invoices & payments, Monthly contracts/installments, Client portal, Support & tickets, Notifications, Work hours, Inventory, Social media & reports, Analytics, Team/gamification, Admin & audit) with: purpose, main screens, data tables behind it, who can use it per role, and whether it is core or optional for a generic CRM.
- **Entity lifecycle & relationships** — how Company/Client → Offer → Order → Invoice → Payment → Review chain together, with the exact foreign keys and the auto-linking rules (email matching, client portal linking).
- **Status matrix** — one table per document type listing every possible state, who can set it, what it triggers, and which states are terminal. Covers the 14 order status flags (multi-status, not a single enum), invoice states (draft/sent/paid/partially paid/overdue/cancelled/refunded), offer states (sent/confirmed/expired), proposal, ticket, and work-hour states.
- **Automations & triggers** — every automatic action in the system: database triggers, scheduled jobs (reminder crons, monthly installment generation, work-hour auto-lock, daily attendance), and event-driven emails. For each: what fires it, conditions, what it writes, who is notified.
- **One-click conversion walkthrough** — a step-by-step trace of the client clicking "Accept offer": link opens the public confirm page → offer fetched → order created with the offer's data → auto-link to the client's portal account by email → team notification email to all internal addresses → branded confirmation email to the client → offer marked confirmed. Each step names the function, table writes, emails, and failure behaviour.
- **Dependency matrix** — for each core action (create, send, edit, delete on Client, Offer, Order, Invoice, Payment): what it reads, what it writes, what it triggers, who gets notified, and what breaks if it fails.
- **Notification catalogue** — all 24 email paths in one table: trigger, recipient, sender address, template, and links used.
- **Roles & permissions matrix** — admin / agent / user / client against every module, including the row-level rules that keep clients scoped to their own data.
- **Integrations** — Resend, Google Sheets sync, Google review links, storage buckets, realtime channels.

**2. Diagrams** (Mermaid, delivered as downloadable files)
- Entity lifecycle flow (Company → Offer → Order → Invoice → Payment → Review)
- Offer acceptance sequence diagram (client, portal, backend, email, team)
- Reminder/automation scheduling flow
- High-level module & data-flow map

## Method

The spec is written from the actual codebase, not from assumptions: read every edge function, service, status helper, database trigger and scheduled job, and query the live schema for foreign keys, triggers, and access rules. Anything ambiguous is marked explicitly as "to confirm" rather than guessed.

## Out of scope

No behaviour changes, no migrations, no redesign proposals — this is a description of the system as it exists today. Recommendations for a multi-tenant/marketable version can follow as a separate document if wanted.
