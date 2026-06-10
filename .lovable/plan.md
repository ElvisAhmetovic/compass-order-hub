## Social Media Section — Daily Checklists per Platform

### Sidebar
Add a new collapsible **Social Media** group in `src/components/dashboard/Sidebar.tsx` (admins + agents). Five child links:
- Facebook (`/social/facebook`)
- ABM Website (`/social/abm-website`)
- Instagram (`/social/instagram`)
- TikTok (`/social/tiktok`)
- Twitter (X) (`/social/twitter`)

Each item gets its own icon (Facebook, Globe, Instagram, Music2, Twitter). The group uses the same expand/collapse pattern as the existing "More..." section.

Note: the legacy `/facebook` and `/instagram` order pages stay where they are — the new pages live under `/social/*` so nothing collides.

### Pages
One reusable page component `SocialMediaChecklistPage` rendered by five thin wrappers (one per platform) under `src/pages/social/`. Routes wired in `src/App.tsx` behind `RequireAuth` with admin/agent guard.

Layout follows the standard: `flex min-h-screen` > Sidebar + `flex-1 flex flex-col` with Layout/Header.

Page contents:
- Header: platform name + today's date (Europe/Berlin).
- Date picker to view past days (read-only when not today, or editable for admins — see below).
- "Add Checklist Item" button → opens a dialog with: Title (required), Description (textarea), Link/URL (optional), Time (optional `time` input), Priority (Low/Med/High select).
- List of items for the selected day, each as a card with:
  - Checkbox to toggle done.
  - Title, description, link (clickable), priority badge, time chip.
  - When checking off → small inline prompt for an optional **completion note**; saved alongside `done_at` and `done_by`.
  - Edit / Delete (delete = soft delete, admins or item creator only).
- Empty state with the Add button.
- Progress summary at the top: `X / Y done`.

### Data model
New table `public.social_media_checklist_items`:
- `id uuid pk`
- `platform text` — enum-like check constraint: `facebook | abm_website | instagram | tiktok | twitter`
- `checklist_date date` — the day this item belongs to (Europe/Berlin date, set client-side)
- `title text not null`
- `description text`
- `link_url text`
- `scheduled_time time`
- `priority text` — `low | medium | high`, default `medium`
- `is_done boolean default false`
- `done_at timestamptz`
- `done_by uuid` (auth user)
- `done_note text`
- `created_by uuid not null`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()` + trigger
- `deleted_at timestamptz` (soft delete)

Indexes on `(platform, checklist_date)` and `(checklist_date)`.

**Shared per platform**: any admin/agent sees the same list for a given platform+date. "Fresh each day" is achieved naturally because queries filter by `checklist_date = today`.

### RLS (permissive, per project standard)
- `GRANT SELECT, INSERT, UPDATE, DELETE ... TO authenticated; GRANT ALL ... TO service_role;`
- Enable RLS.
- SELECT: any authenticated user where `is_admin()` OR profile role in (`admin`,`agent`).
- INSERT: same admin/agent check; force `created_by = auth.uid()`.
- UPDATE: admin/agent (so anyone on the team can tick items off — matches "shared" intent).
- DELETE: `is_admin()` OR `created_by = auth.uid()` (soft delete via UPDATE of `deleted_at` is preferred from the client).

### Service layer
`src/services/socialChecklistService.ts`:
- `listItems(platform, date)` — filters out `deleted_at`.
- `createItem(payload)`
- `updateItem(id, patch)`
- `toggleDone(id, done, note?)` — sets `is_done`, `done_at`, `done_by`, `done_note`.
- `softDelete(id)`

All calls go through the existing `@/integrations/supabase/client`, no `.single()` on updates (per project rule).

### Out of scope
- No notifications/emails for checklist activity.
- No carry-over of unfinished items (explicit user choice: fresh each day).
- No per-user personal lists (explicit: shared per platform).
- No changes to the existing `/facebook` and `/instagram` order pages.

### Files touched
- `supabase/migrations/<new>.sql` — table + grants + RLS + indexes + updated_at trigger.
- `src/components/dashboard/Sidebar.tsx` — add Social Media group + 5 links.
- `src/App.tsx` — register 5 routes.
- `src/pages/social/SocialMediaChecklistPage.tsx` — reusable page.
- `src/pages/social/{Facebook,AbmWebsite,Instagram,TikTok,Twitter}.tsx` — thin wrappers passing the platform key/label.
- `src/components/social/ChecklistItemCard.tsx`
- `src/components/social/AddChecklistItemDialog.tsx`
- `src/services/socialChecklistService.ts`
