# PulseCRM Plan Review + Gap Analysis vs. the Lovable CRM

Two documents were reviewed: the **CRM SaaS Development Plan v3.1** (vision, stack, 4 plan tiers, incremental delivery) and the **PulseCRM Starter Sprint Backlog** (10 sprints, use cases, class diagram, DoD per sprint).

## Verdict on your colleague's plan

The structure is solid and genuinely production-minded:
- Multi-tenancy + RLS + RBAC declared non-negotiable from day one — correct, and the single biggest thing this Lovable app does *not* have.
- Entitlements/feature-flags driven by configuration instead of hard-coded plan checks — correct.
- Subscriptions built early rather than last — correct.
- Sprint order (Customers → Leads → Tasks → Employees/Time → Products → Quotes/Invoices → Payments → Reports → Entitlements → QA) is a sensible dependency chain.

The stack differs from what exists here: she proposes **Next.js + FastAPI (Python) + Supabase**. The current app is **Vite + React + Supabase with edge functions and no separate backend**. That means the rebuild is a genuine rewrite of the data/service layer, not a port. That is a legitimate choice, but it should be a conscious one — the alternative (Next.js + Supabase directly, no FastAPI) would let a large share of the current TypeScript service layer be reused.

## What her plan is missing (features you actually run in production today)

These exist and are battle-tested in the Lovable CRM but appear nowhere, or only vaguely, in the Starter backlog. Each one is a real commercial differentiator.

**Orders & multi-status workflow** — the plan jumps Leads → Opportunities → Invoices. Your business runs on an *Orders* entity with 14 parallel boolean statuses (Created, In Progress, Invoice Sent, Invoice Paid, Complaint, Resolved, Cancelled, Review, Facebook, Instagram, Trustpilot, Trustpilot Deletion, Google Deletion), status history, soft delete/restore, and assignment. "Opportunities + pipeline" does not cover this.

**Offers with public client confirmation** — offer generation, branded email, a public `/confirm-offer/:id` page, manual WhatsApp/Viber share links, VAT breakdown (net / VAT / gross) in the email. Not in the plan at all.

**Automated payment-reminder engine** — per-invoice configurable reminder interval (default 7 days), cron-driven escalation, `next_reminder_at` auto-pause when status leaves sent/overdue, reminder logs, PDF attached to reminder emails. The plan lists "basic reminders" for tasks only.

**Recurring/monthly contracts & billing automation** — monthly contracts, installment generation, a 1st-of-month cron, catch-up job, monthly invoice status board. The plan says "recurring billing" as one bullet with no mechanics.

**Client portal** — isolated `/client/*` routes, separate login, client-scoped orders view, client invoices, client support threads, onboarding dialog, avatar/settings, opt-in notification preferences, multi-language. The plan defers the portal to the Professional tier; you already sell against it.

**Employee time tracking as built** — you have work_hours v2 with submit/lock, deadline logic, auto-lock cron, admin override/unlock with audit trail and reasons, bulk lock, daily attendance cron, auto-fill defaults. Sprint 4 in her plan covers clock in/out and timesheets but not locking, deadlines, admin correction audit, or the automated jobs.

**Email/notification infrastructure** — Resend with domain separation, HTML templates per language, a template manager, send serialization (2/sec rate-limit batching), fire-and-forget dispatch, team distribution lists, notification logs. The plan says "notifications" with no delivery architecture.

**Support & ticketing** — internal support inquiries with replies and unread tracking, tech-support tickets, public customer ticket intake with throttling and attachments. Absent from the plan.

**Invoice depth** — invoice audit log (who created what, and 409 conflicts), atomic `update_invoice_with_lines` RPC, bill-to override separate from the client record, invoice numbering with collision retry, language auto-detection from billing country (10 EU locales), per-country bank details, PDF generator.

**Proposals & templates** — proposal builder, line items, proposal templates, template fields, PDF export, translations.

**Gamification & team layer** — achievements, streaks, challenges, rankings, activity feed, emoji reactions, internal chat with realtime. Listed in the vision doc but with no sprint carrying it.

**Social/marketing module** — per-platform checklists, content ideas, best-times, weekly reports, Search Console-style metrics for the website. Very likely out of scope for a generic CRM, but it is currently ~10% of your app and should be an explicit "excluded / plugin" decision rather than an omission.

**Integrations** — Google Sheets sync, Google review-request flow via Place ID, AI translation via an LLM gateway, calendar events, file attachments with storage privacy rules.

## Gaps in the plan that are architectural, not features

1. **No tenant-branding model.** Selling to multiple companies means per-tenant logo, sender email/domain, invoice numbering prefix, bank details, VAT defaults, locale, and PDF theme. Today all of that is effectively hard-coded or single-row. This needs a `tenant_settings` design in Sprint 1, not later.
2. **Email sending per tenant.** Resend domains are per-company. The plan has no story for tenant-owned sending domains, verification, or fallback to a platform domain.
3. **Cron/background jobs are tenant-blind.** Every scheduled job (reminders, monthly billing, auto-lock, attendance) must iterate tenants and respect each tenant's timezone and business calendar. Nothing in the backlog addresses this.
4. **Storage isolation.** Files must be pathed per tenant with policies, plus per-plan storage quotas that are actually measured. "Limited file storage" has no enforcement story.
5. **No data-migration story.** Bringing your existing production data (67 tables) into the new tenant-scoped schema needs its own sprint.
6. **Testing tenant isolation is declared but not scheduled.** It should be an automated test suite that runs every sprint, not a Sprint 10 checkbox.
7. **Numbering sequences per tenant.** Invoice/offer numbering must be unique per tenant, with collision handling — you already hit 409 conflicts on this in the single-tenant version.

## Recommended changes to the sprint plan

- Add **Sprint 1.5 — Tenant Settings & Branding** (logo, sender identity, numbering prefixes, bank details, VAT, locale, timezone).
- Rename Sprint 2 to **Leads, Opportunities & Orders** and fold the multi-status order workflow in.
- Insert **Offers / Quotes with public confirmation** into Sprint 6 rather than treating quotes as an invoice draft.
- Split Sprint 7 into *Payments* and *Reminder & Recurring-Billing Automation* — the automation layer is a sprint on its own.
- Move a **thin client portal** (read-only orders + invoices) into Starter; it is cheap and it closes deals.
- Add a final **Data Migration & Cutover** sprint.

## Deliverable

A single markdown document, `PULSECRM-GAP-ANALYSIS.md`, at the project root containing everything above, expanded with:
- a feature-by-feature comparison table (Lovable CRM feature → present in plan? → which sprint should own it),
- a table of every current DB table grouped by module, with a keep / rename / drop / tenant-scope recommendation,
- the list of every edge function with its cron schedule and what it must become in multi-tenant form,
- concrete tenant-scoping notes (which tables need `tenant_id`, which are platform-level).

It will also be copied to your documents folder so you can download and send it to your colleague.

## Technical notes

Read-only work: the document is generated from `HANDOFF.md`, the live Supabase schema, the `src/services` and `src/pages` trees, and `supabase/functions`. No application code, database, or edge function is modified.
