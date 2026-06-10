# Social Media Checklist — Power-User Upgrades

Five additions layered on top of the existing per-day, per-platform checklist on `/social/:platform`.

## 1. Weekly / Monthly Calendar View (plan ahead)

- New tab toggle on `SocialMediaChecklistPage`: **Day / Week / Month**.
- Week view: 7-column grid, each column lists that day's checklist items (compact cards: title + time + priority dot).
- Month view: standard month grid; each cell shows a count badge + first 2 item titles; clicking a cell jumps to Day view for that date.
- **Drag & drop**: drag an item card from one day to another to reschedule (updates `scheduled_date` on the existing `social_media_checklist_items` row). Use `@dnd-kit/core` (already in shadcn ecosystem; add if missing).
- "Duplicate to…" context action on an item: copies it to a chosen future date (handy for recurring posts without templates).

## 2. Post-Performance Tracking

- Extend `social_media_checklist_items` with optional engagement fields: `likes`, `shares`, `comments`, `reach`, `impressions`, `performance_note`, `performance_recorded_at`.
- On a completed item, show a **"Add performance"** button → small inline form / dialog with the numeric fields.
- Completed item card displays the metrics inline (e.g. `❤ 124 · ↻ 18 · 💬 9 · 👁 2.4k`).
- Metrics are per-item, not aggregated to a separate table — keeps it simple and tied to the original task.

## 3. Content Idea Backlog

- New table `social_media_content_ideas`: `platform`, `title`, `description`, `link_url`, `tags` (text[]), `status` ('open' | 'used' | 'archived'), `used_on_date`, `used_item_id`.
- New page section (accessible from a **"Ideas"** button on the checklist page) → drawer/dialog listing ideas for the current platform with filter (open / used / archived), search, and add/edit/delete.
- "**Use idea**" button on an idea → opens the existing Add Checklist Item dialog prefilled with title/description/link, scheduled to the currently selected date. On save, idea is marked `used` and linked to the new checklist item.
- Ideas are shared per platform (same access as checklist: admins + agents).

## 4. Best-Time-to-Post Reference Panel

- Collapsible side panel (sheet on mobile, sticky aside on desktop) on the checklist page, per platform.
- **Static defaults** seeded per platform (industry-standard windows, e.g. IG: Tue–Thu 11:00–13:00 & 19:00–21:00, TikTok: Tue/Thu 18:00–22:00, etc.).
- **Data-driven overlay**: once performance data exists, compute average engagement (likes + shares + comments) bucketed by `scheduled_time` hour from past 90 days of items on that platform; render a simple bar/heat strip highlighting top 3 hours.
- Stored in a new table `social_media_best_times` (platform, day_of_week, hour, source 'default' | 'computed', score) refreshed client-side from a query when the panel opens.

## 5. Weekly Accomplishment Report

- New route `/social/:platform/report` (and a top-level `/social/report` for all-platforms summary).
- Date range picker defaulting to current ISO week (Mon–Sun); also quick presets: This week / Last week / This month.
- Sections:
  - **Completed items** count per platform + per day (bar chart).
  - **Completion rate**: completed / total scheduled in range.
  - **Engagement totals**: sum likes / shares / comments / reach for completed items with metrics.
  - **Top performing items**: list top 5 by total engagement, with link.
  - **Carry-over**: items still open past their scheduled date.
- Export button: **Copy as Markdown** (for standup) and **Download CSV**. No PDF/email automation in v1.

## Technical Details

### Database migrations
1. `ALTER TABLE social_media_checklist_items` add: `likes int`, `shares int`, `comments int`, `reach int`, `impressions int`, `performance_note text`, `performance_recorded_at timestamptz`. All nullable.
2. `CREATE TABLE social_media_content_ideas` (id, platform, title, description, link_url, tags text[], status text default 'open', used_on_date date, used_item_id uuid, created_by, created_at, updated_at) + GRANTs to authenticated/service_role + RLS: admins and agents full access (same pattern as `social_media_checklist_items`).
3. `CREATE TABLE social_media_best_times` (id, platform, day_of_week smallint, hour smallint, source text, score numeric, updated_at) + GRANTs + RLS (read all auth, write admins). Seed default rows in migration.

### Frontend
- `src/services/socialChecklistService.ts`: add CRUD for ideas, performance update, best-times read, report aggregation queries.
- New components:
  - `src/components/social/CalendarView.tsx` (week + month, dnd-kit).
  - `src/components/social/PerformanceForm.tsx` (inline metrics editor).
  - `src/components/social/ContentIdeasDialog.tsx`.
  - `src/components/social/BestTimesPanel.tsx`.
  - `src/pages/social/WeeklyReportPage.tsx` (+ route in `App.tsx`).
- `SocialMediaChecklistPage.tsx`: add Day/Week/Month tabs, Ideas & Best Times buttons, Report link.
- Sidebar: add "Reports" sublink under Social.

### Dependencies
- `@dnd-kit/core` and `@dnd-kit/sortable` for drag-and-drop (if not already present).
- `date-fns` (already used) for week/month grid math.
- Recharts (already used) for report bar chart.

## Out of Scope (for this round)
- Auto-fetching live engagement from platform APIs.
- Scheduling/publishing posts directly to platforms.
- Email/Slack delivery of the weekly report.
- Team approval workflow on ideas or items.
