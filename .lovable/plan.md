# Platform-wide engagement entries on the Report

Let the marketing worker log overall engagement, reach and impressions per platform for a chosen day, week, or month, and have those numbers drive the report (replacing per-item sums when present).

## Data model

New table `social_media_platform_metrics`:

- `platform` (text, same enum as elsewhere)
- `period_type` ('day' | 'week' | 'month')
- `period_start` (date — Mon for week, 1st for month)
- `period_end` (date — Sun for week, last day for month, same as start for day)
- `likes`, `shares`, `comments`, `reach`, `impressions` (int, nullable)
- `note` (text, nullable)
- `created_by`, `created_at`, `updated_at`
- Unique on `(platform, period_type, period_start)` so each span has one editable row (upsert).

RLS: admins + agents can read / insert / update; admins or creator can delete (same pattern as ideas/templates).

## UI on the report page (`/social/:platform/report`)

1. **New "Platform metrics" card** at the top of the report:
   - Period-type tabs: Day / Week / Month.
   - Date picker tied to the chosen period type (week shows Mon–Sun span; month shows the chosen month).
   - Inputs: Likes, Shares, Comments, Reach, Impressions, Note.
   - Save / Delete buttons. Save is an upsert keyed on (platform, period_type, period_start).
   - Loads any existing row for the selected period and pre-fills.

2. **History list** below the form: recent platform-metric entries for this platform with period label (e.g. "Week of 9 Jun 2026"), totals, and edit/delete actions.

## Report totals logic

When computing the totals shown in the top stat cards and "Engagement totals" for the selected report range (`from`–`to`):

- Pull all `social_media_platform_metrics` rows for this platform whose `period_start` ≥ `from` and `period_end` ≤ `to` (fully contained in the report range, to avoid partial double-counting).
- For each metric (likes/shares/comments/reach/impressions):
  - If at least one platform-wide row in range has a non-null value for that metric → use the **sum of platform-wide rows** for that metric.
  - Otherwise → fall back to the **sum of per-item metrics** (current behavior).
- Show a small badge on each stat card indicating the source: "Platform totals" vs "From items" so she always knows what she's looking at.
- The "Top performing items" section keeps using per-item metrics as today (platform-wide entries aren't tied to items).
- CSV/Markdown export uses the same combined logic and appends a "Platform metrics" section listing each contributing row.

## Out of scope

- Splitting a week/month entry back across days.
- Auto-fetching from social APIs.
- Reconciliation warnings when both per-item and platform-wide numbers exist (we just prefer platform-wide, per your choice).

## Technical Details

- Migration creates the table with the four-step pattern (CREATE → GRANT to authenticated + service_role → ENABLE RLS → policies) and an updated_at trigger.
- New service file additions in `src/services/socialChecklistService.ts`: `upsertPlatformMetric`, `getPlatformMetric(platform, period_type, period_start)`, `listPlatformMetricsInRange(platform, from, to)`, `deletePlatformMetric(id)`.
- New component `src/components/social/PlatformMetricsCard.tsx` for the form + history.
- Update `src/pages/social/WeeklyReportPage.tsx`:
  - Fetch contained platform-metric rows for `[from, to]` alongside items.
  - Compute totals via the "platform overrides items per metric" rule and annotate cards with source.
  - Add Platform metrics card above the stats grid.
  - Extend CSV/Markdown export.
- `period_start`/`period_end` helpers via existing `date-fns` (`startOfWeek` Mon, `endOfWeek` Sun, `startOfMonth`, `endOfMonth`).
