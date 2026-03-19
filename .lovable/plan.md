

## Reminder / Follow-Up Task Delegation System

Replace the current "Text" sidebar item with a new "Reminders" section that lets users quickly create timed follow-up reminders with delegation, file attachments, and automated email delivery at the exact scheduled time.

### Database

**New table: `follow_up_reminders`**
- `id` (uuid, PK)
- `company_name` (text, not null)
- `contact_phone` (text)
- `note` (text, not null) — free-text call summary
- `remind_at` (timestamptz, not null) — exact datetime to fire
- `assignee_email` (text, not null) — email to send reminder to
- `assignee_name` (text)
- `created_by` (uuid, FK to auth.users)
- `created_by_name` (text)
- `status` (text, default 'scheduled') — scheduled / sent / failed
- `sent_at` (timestamptz)
- `created_at` (timestamptz, default now())

RLS: Non-client authenticated users can SELECT, INSERT, UPDATE, DELETE.

### Edge Function: `send-follow-up-reminders`

- Cron-triggered every minute (like existing payment reminders)
- Queries `follow_up_reminders` where `status = 'scheduled' AND remind_at <= now()`
- For each, sends an email via Resend to `assignee_email` containing:
  - Company/client name
  - Clickable `tel:` phone link
  - Full note/context
  - Created by (who logged the reminder)
- Updates status to `sent` after delivery
- Register in `config.toml` with `verify_jwt = false`
- Set up cron job via SQL insert (like existing payment reminder cron)

### File Attachments

Reuse the existing `file_attachments` table — it already has a generic structure. The new reminders will reference `file_attachments` via a new nullable column `reminder_id` (uuid) on `file_attachments`. The existing `AttachmentUploader` component will be reused on the reminder form.

**Migration adds:**
- `reminder_id` column on `file_attachments` (nullable uuid)
- RLS policy for viewing reminder attachments

### Frontend

**New page: `src/pages/Reminders.tsx`** (replaces TextLibrary at `/text` route)
- Top section: "Create Reminder" form
  - Assignee dropdown (default = current user) — loads team members from `profiles` table (non-client roles)
  - Company name input
  - Contact phone input
  - Note/call summary textarea
  - Date+time picker for `remind_at`
  - File attachment uploader (reuse `AttachmentUploader`)
  - "Save Reminder" button
- Bottom section: List of recent reminders (table/cards)
  - Shows status (scheduled/sent), assignee, company, time
  - Can delete scheduled reminders

**Sidebar update: `src/components/dashboard/Sidebar.tsx`**
- Change the "Text" item label to "Reminders" and icon to `Bell` or `AlarmClock`
- Keep same route `/text` or change to `/reminders` (cleaner)

**Route update: `src/App.tsx`**
- Replace `TextLibrary` import with `Reminders`
- Update route path from `/text` to `/reminders`

### Email Template

Professional HTML email containing:
- Header: "📞 Follow-Up Reminder"
- Company/client name (bold)
- Phone number as clickable `tel:` link with "Call now" label
- Full note text (preserving line breaks)
- "Created by: {name}" footer
- If attachments exist, list them as links

### Summary of Files Changed

1. **New migration** — create `follow_up_reminders` table + add `reminder_id` to `file_attachments`
2. **New edge function** — `supabase/functions/send-follow-up-reminders/index.ts`
3. **`supabase/config.toml`** — register new function
4. **SQL insert** — cron job for every-minute execution
5. **New page** — `src/pages/Reminders.tsx`
6. **`src/App.tsx`** — swap route + import
7. **`src/components/dashboard/Sidebar.tsx`** — rename "Text" → "Reminders", update href + icon
8. **`src/integrations/supabase/types.ts`** — auto-updated after migration

### What Stays

The Text Library page (`TextLibrary.tsx`) and its services remain in the codebase but become unreachable from the sidebar. If you want it fully removed, I can delete those files too.

