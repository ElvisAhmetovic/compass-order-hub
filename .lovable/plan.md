# Audit monthly/contract pages for horizontal overflow

## Scope
Apply the same overflow fix to other monthly/contract-related pages and tables so none of them push the page wider than the viewport.

## Findings

1. `src/pages/YearlyPackages.tsx` — has the same `<div className="flex-1 flex">` wrapper as Monthly Packages did, in **two** places (lines 55 and 69, the loading branch and the main branch). Missing `min-w-0`, so any wide child can widen the page.
2. `src/components/monthly/CronRunStatusPanel.tsx` — renders a results dialog with a list of contract results (client name, month label, reason text, error_detail). Long error strings can stretch the row. The panel itself uses `flex-1 min-w-0` correctly, but the dialog body content should be safe; will re-check during implementation and add `min-w-0` / `break-words` if a long error pushes the dialog wider than its max width.
3. `src/components/monthly/CreateMonthlyContractModal.tsx` and `src/components/monthly/SendMonthlyInvoiceDialog.tsx` — both render inside a fixed-width `Dialog`, so they cannot push the page wider. Only fix if a quick scan shows a child explicitly forcing width (unlikely).
4. `src/components/monthly/MonthlyInstallmentsTable.tsx` — already fixed in the previous turn (header wraps, expanded table is `overflow-x-auto`).

## Fix

1. `src/pages/YearlyPackages.tsx` — add `min-w-0` to both `flex-1 flex` wrappers (lines 55 and 69).
2. `src/components/monthly/CronRunStatusPanel.tsx` — quick read of the dialog body; if any row can render a long unbroken string (error_detail, reason, notes), add `break-words` / `min-w-0` so it wraps instead of stretching.

No logic, data, or styling-system changes. Pure layout containment.
