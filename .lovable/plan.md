

## Monthly Subscription & Automated Billing System

This is a large feature spanning database, edge functions, cron jobs, and UI. Here's the implementation plan broken into phases.

### Database Schema

**New table: `monthly_contracts`** — the master contract record
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| client_name | text NOT NULL | |
| client_email | text NOT NULL | |
| website | text | |
| total_value | numeric NOT NULL | Total contract value |
| monthly_amount | numeric NOT NULL | Auto-calculated (total_value / duration_months) |
| currency | text DEFAULT 'EUR' | |
| start_date | date NOT NULL | |
| duration_months | integer NOT NULL DEFAULT 12 | |
| status | text DEFAULT 'active' | active, completed, cancelled |
| description | text | |
| created_by | uuid | Auth user who created it |
| created_at | timestamptz DEFAULT now() | |
| updated_at | timestamptz DEFAULT now() | |

**New table: `monthly_installments`** — one row per month per contract
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| contract_id | uuid FK → monthly_contracts | |
| month_label | text NOT NULL | e.g. "January 2026" |
| month_number | integer NOT NULL | 1-12 within the contract |
| due_date | date NOT NULL | |
| amount | numeric NOT NULL | |
| currency | text DEFAULT 'EUR' | |
| payment_status | text DEFAULT 'unpaid' | unpaid, paid |
| paid_at | timestamptz | |
| email_sent | boolean DEFAULT false | |
| email_sent_at | timestamptz | |
| client_name | text | Copied from contract |
| client_email | text | Copied from contract |
| website | text | Copied from contract |
| created_at | timestamptz DEFAULT now() | |
| updated_at | timestamptz DEFAULT now() | |

**RLS policies** — Authenticated users can view/manage; admins have full access.

### Edge Function: `generate-monthly-installments`

A cron-triggered function that runs on the 1st of each month:
1. Queries all `monthly_contracts` where `status = 'active'`
2. For each contract, checks if an installment for the current month already exists
3. If not, creates a new `monthly_installments` row with the current month label, amount copied from contract, status = 'unpaid'
4. After creating the installment, sends an email to the client using Resend (same pattern as `send-client-payment-reminder`)
5. Updates `email_sent = true` on success

**Cron setup** — SQL insert (not migration) to schedule `generate-monthly-installments` to run on the 1st of each month at 08:00 UTC.

### Frontend Changes

**1. New page: `src/pages/MonthlyPackages.tsx`**
- Sidebar entry "Monthly Packages" with a Calendar icon
- Dashboard header with "Create Monthly Contract" button (admin only)

**2. New component: `CreateMonthlyContractModal.tsx`**
- Form fields: Client Name*, Client Email*, Website, Total Contract Value*, Currency, Start Date*, Duration (months, default 12), Description
- Auto-calculates and displays monthly installment amount
- On submit, inserts into `monthly_contracts` and pre-generates all installment rows from start_date through duration

**3. New component: `MonthlyInstallmentsTable.tsx`**
- Table columns: Client, Website, Month/Year, Amount, Status (Paid/Unpaid toggle), Progress
- Unpaid rows highlighted red, paid rows green
- Progress column shows "X / Y months paid" with a progress bar
- Status toggle calls Supabase to update `payment_status` and `paid_at`
- Group by contract with expandable rows or filter by client

**4. Sidebar update** — Add "Monthly Packages" link in `Sidebar.tsx`

**5. Router update** — Add `/monthly-packages` route in `App.tsx`

### Files to Create/Modify

| File | Action |
|------|--------|
| Migration SQL | Create `monthly_contracts` and `monthly_installments` tables with RLS |
| `supabase/functions/generate-monthly-installments/index.ts` | New edge function for cron |
| `supabase/config.toml` | Add function config |
| `src/pages/MonthlyPackages.tsx` | New page |
| `src/components/monthly/CreateMonthlyContractModal.tsx` | New contract form |
| `src/components/monthly/MonthlyInstallmentsTable.tsx` | Installments table with paid/unpaid toggle |
| `src/components/monthly/ContractDetailModal.tsx` | View contract + payment history |
| `src/services/monthlyContractService.ts` | CRUD service |
| `src/components/dashboard/Sidebar.tsx` | Add menu item |
| `src/App.tsx` | Add route |
| SQL insert (via tool) | Cron job schedule |

### Technical Details

- The cron function uses the same Resend API key (`RESEND_API_KEY_ABMEDIA`) and sender ("Thomas Klein <ThomasKlein@abm-team.com>") as existing payment reminders
- Price formatting uses `de-DE` locale per existing convention
- When creating a contract, all 12 (or N) installment rows are pre-generated immediately so the table is fully populated from day one
- The cron job's role is to send the monthly email notification and could also generate installments for contracts that start mid-cycle
- The installment month labels use format like "März 2026" (German locale) to match the team's language

