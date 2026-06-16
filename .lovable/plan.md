# Fix social/site report issues

After investigating the report page (`WeeklyReportPage.tsx`) and the metrics card (`PlatformMetricsCard.tsx`) plus the DB, I found three concrete bugs that match what you described. The data IS being saved (I see your entries in `social_media_platform_metrics` with notes intact) — the UI just hides them and silently blocks some saves.

## The three root causes

1. **Notes are invisible everywhere.** The `note` field is saved to the DB but NEVER rendered — not in the "Recent entries" list inside the metrics card, not in the "Recent search performance" / "Recent entries" list at the bottom of the report page. Your worker types the note, it's stored, but no one ever sees it again.

2. **"Recent search performance" list at the bottom is not interactive.** Those rows have no Edit/Delete buttons and aren't clickable. Only the smaller "Recent entries" list inside the metrics card has Edit. Workers naturally look at the bigger list at the bottom of the report and assume it's broken.

3. **"Sometimes doesn't publish" = silent validation block.** The save validator (`socialSchema` / `webSchema`) requires `at least one metric > 0`. If a worker enters only a note, or all zeros, nothing saves and the only feedback is a tiny `_form` error line that's easy to miss. The "Save" button looks like it did nothing.

## What I'll change

### `src/components/social/PlatformMetricsCard.tsx`
- Render the `note` on every row in the "Recent entries" list (truncated, with full text on hover/expand).
- Make each "Recent entries" row clickable to load that period into the form for editing (currently only the small "Edit" button does that).
- Relax both `socialSchema` and `webSchema` so a row can be saved when EITHER any metric is > 0 OR a non-empty note is provided. Note-only entries are valid.
- When validation does fail, surface the message as a toast in addition to the inline text so it can't be missed.
- Re-load history when the parent's `onChanged` fires (add an `externalReloadKey` prop or expose a ref) so the list stays in sync after edits made elsewhere.

### `src/pages/social/WeeklyReportPage.tsx`
- In the bottom "Recent search performance" (web) and "Top performing" lists, render the `note` under each row when present.
- Add Edit and Delete buttons to each row in "Recent search performance". Edit scrolls to the `PlatformMetricsCard` and loads that period (via a small shared state — lifted `periodType`/`anchor` or a callback prop on the card). Delete calls `deletePlatformMetric` then refreshes.
- Pass a `reloadKey` prop into `PlatformMetricsCard` so it reloads its history when the parent reloads (covers deletes made from the bottom list).

### No DB / RLS changes
I checked the RLS policies and the actual rows. Policies allow admin/agent role for SELECT/INSERT/UPDATE/DELETE, all your workers are `admin` in `profiles`, and your recent entries (including notes) are present in the DB. This is purely a frontend visibility + UX problem, not a permissions or persistence problem.

## Out of scope
- No schema migrations.
- No changes to how items (checklist entries) save — only the per-period platform/site metrics flow that your screenshot is on.
- No changes to the Markdown/CSV export (notes are already included there).

Approve and I'll implement.