# Fix Monthly Packages page still overflowing horizontally

## Problem
After the previous fix to the contract header row, the Monthly Packages page still requires the user to scroll horizontally to see the right side of the page. The contract rows themselves no longer overflow, but the page as a whole is wider than the viewport.

## Root cause
The page layout chain is:

```text
<div className="flex min-h-screen">
  <Sidebar />
  <div className="flex-1 flex">        <- no min-w-0
    <Layout>                            <- Layout's outer div is flex-1 with no min-w-0
      <div className="space-y-6"> ...   <- contract rows + inner table
```

In a flex container, a flex child's default minimum width is the width of its content, not zero. Without `min-w-0` on the intermediate wrappers, any wide child (the expanded installments `<Table>`, the cron status panel, or a long client email/website inside a contract header) pushes the whole page wider than the sidebar leaves room for, so the browser shows a horizontal scrollbar.

Other pages like Facebook/Instagram have the same wrapper pattern but their `OrderTable` self-contains its overflow. Monthly Packages doesn't, so the overflow bubbles up to the page.

## Fix
Constrain the flex chain so children can shrink to the available width and any wide content (table, panel) scrolls inside its own container instead of widening the page.

1. `src/pages/MonthlyPackages.tsx` — add `min-w-0` to the `flex-1 flex` wrapper around `<Layout>`.
2. `src/components/layout/Layout.tsx` — add `min-w-0` to the outer `flex-1` wrapper so Layout itself cannot exceed its flex slot.
3. `src/components/monthly/MonthlyInstallmentsTable.tsx` — add `overflow-x-auto` to the expanded installments table wrapper so a wide installments table scrolls inside the contract card instead of widening the page.

No logic changes, no other pages touched.
