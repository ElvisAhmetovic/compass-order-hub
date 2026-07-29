# Project Handoff — AB Media Team CRM

A complete breakdown of this project for a developer who is taking a copy of the codebase and adapting it into a generic, marketable CRM for other companies.

---

## 1. Tech Stack

**Frontend**
- React 18 + Vite 5 + TypeScript 5
- Tailwind CSS v3 + shadcn/ui (Radix primitives)
- React Router v6 (SPA routing)
- TanStack Query for server state; React Context for auth, theme, client language
- Recharts (analytics), lucide-react (icons), sonner + shadcn toaster

**Backend (Supabase — project ref `fjybmlugiqmiggsdrkiq`)**
- Postgres with Row-Level Security on every table
- Supabase Auth (email/password, JWT)
- Supabase Storage — buckets: `team-files` (public), `ticket-attachments` (private)
- Supabase Edge Functions (Deno) — ~55 deployed
- Supabase Realtime — used for sidebar config, chat, client-order projections, notifications

**Third-party**
- **Resend** — all outbound email. Two verified domains:
  - `abm-team.com` — financial + client emails (invoices, reminders, portal invites)
  - `empriadental.de` — support/ticket emails
- **Lovable AI Gateway** (`LOVABLE_API_KEY`) — upsell translations and Lovable-managed auth email templates
- **Google Sheets API** (service account) — order sync to a shared sheet
- **Google Places API** — used to build Google review request links (`GOOGLE_REVIEW_PLACE_ID`)

**Hosting**
- App: `empriatech.com` (Lovable-hosted)
- Client portal subdomain: `portal.empriatech.com` → 301 to `/client/login`
- Published preview: `compass-order-hub.lovable.app`

---

## 2. Auth & Roles

- Supabase Auth session managed in `src/context/AuthContext.tsx`
- Role enum `app_role`: `admin | agent | user | client`
- Roles stored in `public.user_roles` (source of truth) with a `profiles.role` mirror used as legacy fallback
- Route guards: `AuthGuard`, `AdminGuard`, `RequireAuth` in `src/components/auth/`
- Login (`/login`) redirects: admin/agent/user → `/dashboard`, client → `/client/dashboard`
- Registration (`/register`) — admin-driven via `create-user` / `create-admin-user` edge functions
- Password reset: `resetPasswordForEmail` → `/reset-password`
- Admin-initiated password resets email the plain-text new password to primary admins (`notify-password-change`)
- Client accounts auto-provisioned via `send-client-portal-credentials`: 14-char passwords, auto-linked to past orders by email

---

## 3. Data Model (67 tables — grouped)

### Core CRM
- `orders` (43 columns; multi-status booleans, soft delete, client visibility flags)
- `companies`, `clients` (unidirectional sync Companies → Clients to avoid €0 orders)
- `order_status_history`, `order_audit_logs`, `comments`, `file_attachments`

### Invoicing
- `invoices` (includes `bill_to_*` override columns for PDF), `invoice_line_items`, `invoice_sequences`
- `invoice_audit_logs`, `invoice_payment_reminders`, `payments`, `payment_reminders`, `payment_reminder_logs`
- Numbering: `INV-{year}-{sequence}` via `generate_invoice_number()` with a collision retry loop
- Atomic saves via RPC `update_invoice_with_lines`

### Proposals / Offers
- `proposals`, `proposal_line_items`, `proposal_templates`, `offers`

### Monthly packages / contracts *(candidate for removal in generic CRM)*
- `monthly_contracts`, `monthly_installments`, `monthly_cron_runs`, `monthly_cron_contract_results`

### Support *(candidate for slimming)*
- `support_inquiries`, `support_replies`, `support_reply_reads`
- `customer_tickets`, `ticket_attachments`, `tech_support_tickets`

### Social media *(candidate for removal)*
- `social_media_checklist_items`, `social_media_checklist_templates`
- `social_media_content_ideas`, `social_media_platform_metrics`, `social_media_best_times`

### Team / gamification *(candidate for removal)*
- `team_activities`, `team_challenges`, `user_achievements`, `achievement_definitions`, `user_streaks`

### Work hours *(optional module)*
- `work_hours`, `work_hours_v2`, `work_hours_audit_log` (+ `wh_*` RPCs, cron auto-lock, attendance)

### Internal messaging
- `channels`, `messages`, `reactions`

### Config / infra
- `profiles`, `user_roles`, `user_settings`, `user_permissions`, `app_users`
- `sidebar_config` — realtime-driven nav visibility (KEY for white-labeling)
- `notification_settings`, `notifications`, `notification_logs`
- `email_templates`, `template_fields`, `background_templates`
- `company_settings`, `inventory_items`, `upsells`, `upsell_categories`, `upsell_translations`
- `calendar_events`, `tasks`, `follow_up_reminders`

---

## 4. Edge Functions (~55, grouped by purpose)

**User / auth**
`create-user`, `create-admin-user`, `update-user-admin-status`, `delete-user-data`, `export-user-data`, `notify-password-change`, `request-client-credentials`, `send-client-invite`, `send-client-portal-credentials`, `generate-totp-secret`, `verify-totp`, `get-active-sessions`, `terminate-session`, `terminate-all-sessions`

**Orders**
`send-order-created-notification`, `send-order-confirmation`, `send-status-change-notification`, `send-service-delivered-notification`, `send-order-payment-reminders`, `send-review-request`, `sync-order-to-sheets`

**Invoices / payments**
`send-invoice-pdf`, `send-invoice-payment-reminders`, `send-payment-reminder`, `send-payment-confirmation`, `send-client-payment-reminder`

**Offers / proposals**
`send-offer-email`, `confirm-offer`

**Support**
`send-support-inquiry-notification`, `send-tech-support-notification`, `create-client-ticket`, `create-tech-support-ticket`, `assign-customer-ticket`

**Monthly / work-hours** *(optional modules)*
`generate-monthly-installments`, `monthly-billing-catchup`, `send-monthly-contract-created`, `send-monthly-toggle-notification`, `send-follow-up-reminders`, `send-workhours-daily-reminder`, `wh-auto-lock`, `check-daily-attendance`

**Client portal**
`send-client-status-notification`

**Misc**
`translate-upsell` (Lovable AI), `generate-encryption-report`, `get-data-processing-info`

---

## 5. Email System

- Sender identities live in Resend under two domains
- Primary sender: `invoice@team-abmedia.com`
- Team recipient list hard-coded at `src/constants/notificationEmails.ts` (13 members) — **the first file to edit for a new tenant**
- Rate-limit rule: Resend caps at 2 req/sec → all fan-outs use 8s queue delay or serial batching (`src/utils/notificationQueue.ts`)
- Dispatch pattern: fire-and-forget from UI; DB updates remain synchronous
- Auth emails: handled by Lovable's `auth-email-hook` using `LOVABLE_API_KEY`
- PDF generation for invoices/proposals: client-side (`src/utils/invoicePdfGenerator.ts`, `src/utils/proposal/pdfGenerator.ts`), attached as base64 to reminder emails

---

## 6. Notifications (in-app)

- Global listener: `src/components/layout/GlobalNotifications.tsx`
- Payment-reminder due badge + triple-beep + pulsing UI: `usePaymentReminderDueNotifications`
- Deep-linking convention: modals open via `?orderId=`, `?inquiryId=`, etc., and clear the param on close
- Toasts: shadcn `useToast` + sonner

---

## 7. Sidebar / Feature Toggles (KEY for productizing)

- `public.sidebar_config.hidden_items[]` drives which nav items appear; realtime-synced (`useSidebarConfig`)
- Your colleague can hide *Monthly Packages*, *Social Media*, *Work Hours*, *Support*, *Rankings*, *Tech Support*, *Yearly Packages*, etc. **without deleting any code** — this is the fastest first pass to a generic CRM

---

## 8. Routing Map (`src/App.tsx` / `AppImports.tsx`)

**Public**
`/login`, `/register`, `/reset-password`, `/ticket-loading`, `/ticket-submitted`, `/confirm-offer/:id`

**Admin / agent**
`/dashboard`, `/active-orders`, `/complaints`, `/completed`, `/cancelled`, `/invoice-sent`, `/invoice-paid`, `/deleted`, `/reviews`, `/companies`, `/clients`, `/invoices`, `/invoices/:id`, `/proposals`, `/offers`, `/inventory`, `/analytics`, `/settings`, `/profile`, `/user-management`, `/user-statistics`, `/notification-settings`, `/security`, `/reminders`, `/email-management`, `/text-library`, `/monthly-*`, `/work-hours*`, `/support*`, `/tech-support*`, `/rankings`, `/social/*`, `/team-collaboration`

**Client portal**
`/client/login`, `/client/dashboard`, `/client/orders`, `/client/orders/:id`, `/client/invoices`, `/client/support`, `/client/support/:id`, `/client/settings`

---

## 9. Integrations & Secrets (Supabase Vault)

| Secret | Purpose |
|---|---|
| `RESEND_API_KEY`, `RESEND_API_KEY_ABMEDIA` | Outbound email (two domains) |
| `LOVABLE_API_KEY` | AI translations + auth email hook |
| `GOOGLE_SHEETS_CLIENT_EMAIL`, `GOOGLE_SHEETS_PRIVATE_KEY`, `GOOGLE_SHEETS_SPREADSHEET_ID` | Order sync |
| `GOOGLE_REVIEW_PLACE_ID` | Google review link generation |
| `APP_URL` | Deep-link base (`empriatech.com`) |
| `SUPABASE_*` | Auto-populated |

---

## 10. What to Strip for a Generic CRM (recommended)

### Immediately hide via `sidebar_config` (zero code risk)
Social Media, Monthly Packages, Yearly Packages, Rankings, Work Hours, Tech Support, Team Collaboration, Reviews

### Rebrand touchpoints
- `src/constants/notificationEmails.ts` — team recipient list
- `src/components/dashboard/Sidebar.tsx` — "AB Media Team CRM" title + external link
- `src/services/companySettingsService.ts` + `src/utils/proposal/companyInfo.ts` — `DEFAULT_COMPANY_INFO`
- All Resend sender identities + `APP_URL` secret
- `index.html` — `<title>` and meta description
- Google Sheets / Places secrets → optional per tenant

### Optionally delete (if truly not needed)
The tables, edge functions, pages, and services flagged as *candidate for removal* in §3/§4.

### Keep as the generic CRM core
Auth + roles, `orders`, `companies`, `clients`, `invoices` (+line items, sequences, audit, reminders), `proposals` / `offers`, `inventory`, `email_templates`, `notifications`, `calendar_events`, `tasks`, `file_attachments`, `comments`, `profiles`, `user_roles`, `sidebar_config`, `company_settings`, and the client portal.

---

## 11. Known Conventions Your Colleague Must Respect

- Never store roles on `profiles.role` alone — always use `user_roles` + `has_role()`
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser (edge functions only)
- Every new `public` table needs `GRANT` statements in the same migration (RLS is not enough)
- European price format (`de-DE`, `€399,99`)
- Passwords: min 8 chars, 1 uppercase, 1 lowercase, 1 number
- Admin layout wrapper pattern: `flex min-h-screen` → `flex-1 flex flex-col` (preserves header)
- Supabase Realtime subscriptions must live inside `useEffect` with cleanup that calls `supabase.removeChannel(channel)`
- Standalone pages navigate with hardcoded `navigate('/dashboard')`, never `navigate(-1)`
- Avoid `.single()` on updates — silent RLS filtering can look like a success
- Edge functions need comprehensive `corsHeaders` and `Access-Control-Allow-Origin: *`

---

## 12. Quick-Start for the New Developer

1. Extract the ZIP and open `project-explorer.html` to browse files without an editor.
2. Create a fresh Supabase project (or fork ours) and paste the URL + anon key into `.env`.
3. Run all migrations from `supabase/migrations/` in order.
4. Deploy edge functions with `supabase functions deploy` (or via Lovable Cloud).
5. Add secrets from §9 to the new Supabase project.
6. Edit `src/constants/notificationEmails.ts` and the branding touchpoints in §10.
7. Log in as admin and use `Settings → Sidebar` (backed by `sidebar_config`) to hide unwanted modules.
8. Rebrand `index.html`, sidebar title, and default company info.

That's enough to have a working, rebranded generic CRM.
