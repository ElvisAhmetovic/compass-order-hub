
# Project Handoff Breakdown

Deliverable: a single `HANDOFF.md` at the repo root that your colleague can read alongside the ZIP / project-explorer. Nothing in the running app changes — this is documentation only. Below is exactly what the doc will contain.

---

## 1. Tech Stack

**Frontend**
- React 18 + Vite 5 + TypeScript 5
- Tailwind CSS v3 + shadcn/ui (Radix primitives)
- React Router v6 (SPA routing)
- TanStack Query (server state), React Context (auth, theme, client language)
- Recharts (analytics), lucide-react (icons), sonner + custom toaster

**Backend (Supabase — project ref `fjybmlugiqmiggsdrkiq`)**
- Postgres with RLS on every table
- Supabase Auth (email/password, JWT)
- Supabase Storage (`team-files` public, `ticket-attachments` private)
- Supabase Edge Functions (Deno) — ~55 functions deployed
- Supabase Realtime (sidebar config, chat, client orders, notifications)

**Third-party**
- Resend — all outbound email (two domains: `abm-team.com` financial/client, `empriadental.de` support)
- Lovable AI Gateway (`LOVABLE_API_KEY`) — used for upsell translations and auth email templates
- Google Sheets API (service-account) — order sync
- Google Places API — review-request links (`GOOGLE_REVIEW_PLACE_ID`)

**Hosting**
- App: `empriatech.com` (Lovable-hosted)
- Client portal subdomain: `portal.empriatech.com` → `/client/login`
- Published preview: `compass-order-hub.lovable.app`

---

## 2. Auth & Roles

- Supabase Auth session in `src/context/AuthContext.tsx`
- Roles enum `app_role`: `admin | agent | user | client`
- Roles stored in `public.user_roles` (never on profile) + `public.profiles` mirror for legacy fallback
- Guards: `AuthGuard`, `AdminGuard`, `RequireAuth` in `src/components/auth/`
- Login: `/login` (admins/agents/users → `/dashboard`, clients → `/client/dashboard`)
- Register: `/register` (admin-created via `create-user` / `create-admin-user` edge functions)
- Password reset: `resetPasswordForEmail` → `/reset-password`
- Admin password resets emailed plain-text to primary admins (see `notify-password-change`)
- Client accounts auto-created via `send-client-portal-credentials` (14-char passwords, linked to past orders by email)

---

## 3. Data Model (67 tables — grouped)

**Core CRM**
- `orders` (43 cols, multi-status booleans, soft delete, client visibility flags)
- `companies`, `clients` (unidirectional sync Companies → Clients)
- `order_status_history`, `order_audit_logs`, `comments`, `file_attachments`

**Invoicing**
- `invoices` (with `bill_to_*` override columns), `invoice_line_items`, `invoice_sequences`
- `invoice_audit_logs`, `invoice_payment_reminders`, `payments`, `payment_reminders`, `payment_reminder_logs`
- Numbering: `INV-{year}-{seq}` via `generate_invoice_number()` with collision loop
- Atomic saves via RPC `update_invoice_with_lines`

**Proposals / Offers**
- `proposals`, `proposal_line_items`, `proposal_templates`, `offers`

**Monthly packages / contracts** (candidate for removal)
- `monthly_contracts`, `monthly_installments`, `monthly_cron_runs`, `monthly_cron_contract_results`

**Support** (candidate for slimming)
- `support_inquiries`, `support_replies`, `support_reply_reads`
- `customer_tickets`, `ticket_attachments`, `tech_support_tickets`

**Social media** (candidate for removal)
- `social_media_checklist_items`, `social_media_checklist_templates`
- `social_media_content_ideas`, `social_media_platform_metrics`, `social_media_best_times`

**Team / gamification** (candidate for removal)
- `team_activities`, `team_challenges`, `user_achievements`, `achievement_definitions`, `user_streaks`

**Work hours** (candidate for removal or optional module)
- `work_hours`, `work_hours_v2`, `work_hours_audit_log` (+ `wh_*` RPCs)

**Messaging**
- `channels`, `messages`, `reactions`

**Config / infra**
- `profiles`, `user_roles`, `user_settings`, `user_permissions`, `app_users`
- `sidebar_config` (realtime-driven sidebar hiding — key for white-labeling!)
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

**Monthly / work-hours** (optional modules)
`generate-monthly-installments`, `monthly-billing-catchup`, `send-monthly-contract-created`, `send-monthly-toggle-notification`, `send-follow-up-reminders`, `send-workhours-daily-reminder`, `wh-auto-lock`, `check-daily-attendance`

**Client portal**
`send-client-status-notification`

**Misc**
`translate-upsell` (Lovable AI), `generate-encryption-report`, `get-data-processing-info`

---

## 5. Email System

- Sender identities live in Resend under two domains (see `mem://integrations/resend-api-key-separation`)
- Primary sender: `invoice@team-abmedia.com`
- Team recipient list hard-coded at `src/constants/notificationEmails.ts` (13 members) — this is the first place a new company will edit
- Rate-limit rule: Resend caps at 2 req/sec → all bulk fan-out uses 8s queue delay or serial batching
- Dispatch pattern: fire-and-forget from UI, DB updates are synchronous (`mem://ux/non-blocking-email-dispatch`)
- Auth emails: managed by Lovable's `auth-email-hook` using `LOVABLE_API_KEY`

---

## 6. Notifications (in-app)

- Global listener: `src/components/layout/GlobalNotifications.tsx`
- Payment reminder due badge + triple-beep + pulsing UI (`usePaymentReminderDueNotifications`)
- Deep-linking convention: modals open via `?orderId=` etc., cleared on close
- Toast: shadcn `useToast` + sonner

---

## 7. Sidebar / Feature Toggles (KEY for productizing)

- `public.sidebar_config.hidden_items[]` drives which nav items are shown, realtime-synced (`useSidebarConfig`)
- Your colleague can hide `Monthly Packages`, `Social Media`, `Work Hours`, `Support`, `Rankings`, `Tech Support`, `Yearly Packages`, etc. **without deleting code** — this is the fastest first-pass to a generic CRM

---

## 8. Routing Map (`src/App.tsx` / `AppImports.tsx`)

Public: `/login`, `/register`, `/reset-password`, `/ticket-loading`, `/ticket-submitted`, `/confirm-offer/:id`
Admin/agent: `/dashboard`, `/active-orders`, `/complaints`, `/completed`, `/cancelled`, `/invoice-sent`, `/invoice-paid`, `/deleted`, `/reviews`, `/companies`, `/clients`, `/invoices`, `/invoices/:id`, `/proposals`, `/offers`, `/inventory`, `/analytics`, `/settings`, `/profile`, `/user-management`, `/user-statistics`, `/notification-settings`, `/security`, `/reminders`, `/email-management`, `/text-library`, `/monthly-*`, `/work-hours*`, `/support*`, `/tech-support*`, `/rankings`, `/social/*`, `/team-collaboration`
Client portal: `/client/login`, `/client/dashboard`, `/client/orders`, `/client/orders/:id`, `/client/invoices`, `/client/support`, `/client/support/:id`, `/client/settings`

---

## 9. Integrations & Secrets (in Supabase Vault)

- `RESEND_API_KEY`, `RESEND_API_KEY_ABMEDIA` — email
- `LOVABLE_API_KEY` — AI translations & auth emails
- `GOOGLE_SHEETS_CLIENT_EMAIL`, `GOOGLE_SHEETS_PRIVATE_KEY`, `GOOGLE_SHEETS_SPREADSHEET_ID` — order sync
- `GOOGLE_REVIEW_PLACE_ID` — Google review link generation
- `APP_URL` — deep-link base (`empriatech.com`)
- `SUPABASE_*` — auto-populated

---

## 10. What to Strip for a Generic CRM (recommended)

**Immediately hide via `sidebar_config`** (zero code risk):
Social Media, Monthly Packages, Yearly Packages, Rankings, Work Hours, Tech Support, Team Collaboration, Reviews

**Rebrand touchpoints**:
- `src/constants/notificationEmails.ts` — team list
- `src/components/dashboard/Sidebar.tsx` — "AB Media Team CRM" title + link
- `src/services/companySettingsService.ts` + `src/utils/proposal/companyInfo.ts` — `DEFAULT_COMPANY_INFO`
- All Resend sender identities + `APP_URL` secret
- `index.html` `<title>` + meta description
- Google Sheets/Places secrets → optional per tenant

**Optionally delete** (if truly not needed): the tables, edge functions, pages, and services listed under §3/§4 as "candidate for removal"

**Keep as the generic CRM core**:
Auth + roles, `orders`, `companies`, `clients`, `invoices` (+line items, sequences, audit, reminders), `proposals`/`offers`, `inventory`, `email_templates`, `notifications`, `calendar_events`, `tasks`, `file_attachments`, `comments`, `profiles`, `user_roles`, `sidebar_config`, `company_settings`, client portal.

---

## 11. Known Conventions Your Colleague Must Respect

- Never store roles on `profiles.role` alone — always `user_roles` + `has_role()`
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser
- Every new `public` table needs `GRANT` statements in the same migration
- European price format (`de-DE`, `€399,99`)
- Passwords: min 8 chars, 1 upper, 1 lower, 1 number
- Admin layout wrapper: `flex min-h-screen` → `flex-1 flex flex-col`
- Realtime subscriptions must live inside `useEffect` with cleanup

---

## Deliverable

One file: `HANDOFF.md` at the repo root containing everything above, formatted for reading and search. No app code touched.
