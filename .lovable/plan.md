

## Fix Line Items Table to Show All Columns Without Scrolling

The line items table is inside a `lg:col-span-2` column of a 3-column grid, which constrains its width. The description column has `w-1/2 min-w-[400px]` and the wrapper has `min-w-[1000px]`, forcing horizontal scroll.

### Changes

**`src/pages/InvoiceDetail.tsx`**
- Move the Line Items card **outside** the 3-column grid so it spans full width, or change the grid so the line items section gets `lg:col-span-3` (full width)
- The simplest approach: close the `lg:col-span-2` div before the Line Items card, render Line Items at `lg:col-span-3` full width, then continue with the Summary card in its own column

**`src/components/invoices/LineItemRow.tsx`**
- Reduce description column from `w-1/2 min-w-[400px]` to `min-w-[250px]` so columns fit naturally
- Shrink oversized input heights from `h-14` to `h-10` for a cleaner look

**`src/pages/InvoiceDetail.tsx` (table headers)**
- Reduce description header `min-w-[350px]` to `min-w-[200px]`
- Remove `w-1/2` constraint

This way the table uses the full page width and all columns are visible without scrolling.

