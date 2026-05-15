# Polish the Work Hours Admin export

## Goal
Replace the bare-bones CSV dump on `/admin/work-hours` with a properly formatted export so it opens cleanly in Excel/Numbers/Sheets and looks professional.

## What's wrong today
- No UTF-8 BOM → Excel mangles special chars (ć, ž, €, etc.)
- Fields aren't quoted/escaped → commas or quotes in notes break columns
- ISO timestamps and date strings, no European formatting
- No totals row, no friendly headers
- Single format only

## Changes

### `src/pages/WorkHoursAdmin.tsx` — `exportCSV`
- Add `\uFEFF` BOM and use `;` as delimiter (Excel-de friendly).
- Properly escape every field (wrap in `"`, double internal `"`, strip newlines).
- Friendly headers: `Date, Worker, Email, Status, Locked, Hours, Start, End, Break (min), Worker Note, Admin Note, Submitted, Last Updated`.
- Format `work_date` as `DD.MM.YYYY` (de-DE), times as `HH:MM`, timestamps as `DD.MM.YYYY HH:MM`.
- Map `status` to readable labels (Submitted / Not submitted / Not worked / Admin override).
- `Locked` shown as `Yes/No`.
- Append a totals row: blank cells + `TOTAL` + sum of hours.
- Filename keeps `work_hours_{from}_{to}.csv`.

### Add Excel (.xlsx) export button next to CSV
- New `exportXLSX` using `xlsx` (SheetJS — already common; if missing, install via `bun add xlsx`).
- Same columns, with: bold header row, frozen top row, auto column widths, number format on Hours (`0.00`), and a totals row.
- Filename `work_hours_{from}_{to}.xlsx`.
- Add a `<Button>` in the toolbar labeled "Excel" with the `Download` icon, alongside the existing CSV button.

No backend, RPC, or schema changes.

## QA
1. Export CSV with rows containing commas, quotes, German chars in notes → opens correctly in Excel with all columns intact.
2. Open the .xlsx → header is bold, columns auto-sized, hours column right-aligned with 2 decimals, totals row at the bottom.
3. Date column reads `15.05.2026`, not `2026-05-15`.
4. Empty range exports header + totals only without errors.
