## Goal
Make the ABM Website report track Google Search Console / GA-style metrics instead of social engagement (likes, shares, comments, reach, impressions).

## Metrics for ABM Website
Replace the 5 social fields with 6 web analytics fields:
- **Clicks** — total clicks from Search (GSC)
- **Impressions** — times site appeared in Search (GSC)
- **CTR (%)** — click-through rate (GSC) — decimal, 0–100
- **Avg. position** — average ranking position (GSC) — decimal
- **Users** — unique visitors (GA, optional)
- **Sessions** — total sessions (GA, optional)

All other platforms (Facebook, Instagram, TikTok, Twitter) keep the existing social engagement fields unchanged.

## Database
Add 4 nullable numeric columns to `social_media_platform_metrics`:
- `clicks integer`
- `ctr numeric(5,2)` (0–100, 2 decimals)
- `avg_position numeric(5,2)`
- `users integer`
- `sessions integer`

Reuse the existing `impressions integer` column for GSC impressions (same concept). The social-only columns (`likes`, `shares`, `comments`, `reach`) simply stay null for `abm_website` rows.

## UI — `PlatformMetricsCard.tsx`
Branch the field set by `platform`:
- If `platform === "abm_website"`: render Clicks, Impressions, CTR, Avg Position, Users, Sessions inputs. CTR allows one decimal (0–100 cap); Avg Position allows one decimal (≥0). Others are non-negative integers. Validation requires at least one field > 0.
- Otherwise: keep today's likes/shares/comments/reach/impressions form.
- Recent-entries summary line also branches: shows `🖱 clicks · 👁 impressions · CTR x% · pos x.x · 👥 users · 📈 sessions` for abm_website.
- Title/help text says "Search & site analytics" instead of "engagement" when abm_website.

## UI — `WeeklyReportPage.tsx`
On the ABM Website report only:
- Stats cards become: **Completion rate**, **Overdue**, **Clicks / Impressions** (with CTR underneath), **Avg position / Users** (sessions underneath). Source badge logic (`platform` vs `items`) is dropped for abm_website since per-item fields don't apply — totals always come from platform-metric entries.
- Hide the "Top performing items" card for abm_website (engagement-based, not meaningful here). Show instead a small "Recent search performance" list summarising the latest platform-metric entries.
- Markdown export + CSV export use the new fields for abm_website.

Other platforms render unchanged.

## Service layer (`socialChecklistService.ts`)
- Extend `PlatformMetric` type and `upsertPlatformMetric` payload with `clicks`, `ctr`, `avg_position`, `users`, `sessions` (all nullable).
- No new endpoints needed.

## Out of scope
- Live pulling from Google Search Console / Analytics APIs (manual entry only, same pattern as social).
- Per-item GSC tracking on individual checklist items.
- Historical trend charts of clicks/impressions (current bar chart of completed items stays).

## Technical notes
- Migration uses `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`; no GRANT/RLS changes needed.
- CTR input sanitised to digits + single dot, clamped 0–100; Avg position same pattern, no upper clamp.
- Zod schema branches: `abmWebsiteSchema` (numbers can be null, CTR ≤ 100, at-least-one rule) vs existing `socialSchema`.
