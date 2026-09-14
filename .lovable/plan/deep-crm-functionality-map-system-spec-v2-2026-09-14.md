# Deep CRM Functionality Map (SYSTEM_SPEC v2)

`SYSTEM_SPEC.md` already covers the system at a high level. This plan expands it into a build-from-scratch reference: every action, every automatic email, every link between modules. Documentation only — no application changes.

## What gets added

**1. `SYSTEM_SPEC.md` — expanded in place**

New and deepened sections:

- **Action catalogue.** For every user action in the system (create/send/edit/delete on Offer, Proposal, Order, Invoice, Payment, Reminder, Client, Portal account, Ticket, Work hours, Monthly contract): who can do it, which screen it lives on, what is written to the database, which emails leave the system, which other records change as a side effect, and what happens when it fails halfway.
- **Offer → Order conversion, step by step.** The full one-click path: how the offer link is generated and shared (email, WhatsApp, Viber), what the public confirm page shows, what happens the moment the client clicks Accept — order created with the offer's data and VAT figures, auto-link to the client's portal account by email, team notification, branded client confirmation, offer marked confirmed, double-click protection. Includes the admin-confirms-on-behalf path.
- **Invoice lifecycle in depth.** When an invoice can be created (manual button, order status flag, monthly installment), how the invoice number is produced and how collisions are retried, the one-active-invoice-per-order rule, bill-to overrides, PDF generation and sending, partial payments, status transitions and who/what causes each.
- **Reminder engine in depth.** Which invoices get picked up, the 7-day default and per-invoice override, the per-client off switch, pause flags, escalation wording at reminder 2 and 3+, language detection, self-healing when the order is already paid or cancelled, and how manual reminders differ.
- **Notification map.** One table per audience (client, internal team, individual assignee, admin) listing every automatic message: what fires it, the exact condition, recipient, template, links inside, and whether it blocks the action or is fire-and-forget. Includes in-app notifications and the notification bell, not just email.
- **Cross-module link map.** How Company, Client, Portal account, Order, Invoice, Payment and Review are tied together — which links are real foreign keys and which are soft matches on name or email, plus what breaks when a soft match misses.
- **Scheduled jobs table.** Each recurring job: schedule, what it scans, what it writes, what it sends, and what happens on a missed run.
- **Role and permission matrix.** admin / agent / worker / client against every module and every action, including the row-level rules that keep a client inside their own data.
- **Edge cases and failure behaviour.** Duplicate clients with the same email, two orders for the same client, an offer confirmed twice, invoice number collisions, email provider rejections, a client with no portal account.

**2. Diagrams** (Mermaid, downloadable files)

- Full entity lifecycle: lead → offer → order → invoice → payment → review
- Offer acceptance sequence: client, public page, backend, database, emails, team
- Invoice and reminder state machine
- Automatic-notification map by trigger

## Method

Everything is written from the real code and the live database — edge functions, services, database triggers, scheduled jobs and access rules are read directly. Anything that cannot be confirmed is marked "to confirm" rather than guessed.

## Out of scope

No behaviour changes, no migrations, no redesign. Multi-tenant productization notes stay in the separate handoff document.  
  
needs to be super detailed, not like basic surface level 