# Site performance check: findings and improvements

## What I measured (live site, empriatech.com)
| Page | First response | Page ready | Download |
|---|---|---|---|
| Homepage | 0.58 s | 2.1 s | ~1 MB |
| Webdesign page | 0.20 s | 0.9 s | ~1 MB |
| CRM login | 0.21 s | 1.1 s | ~1 MB |

Database (cumulative stats): the orders list is still the heaviest item, at 80 ms average and up to 7 s peak. These numbers mostly predate this morning's fixes, so they will only show the improvement as new usage builds up. Two small staff and work-hours lookups have each run more than 150,000 times.

## What's slowing things down
1. **Every visitor downloads the entire CRM.** The public homepage, the service pages and the login all load one ~1 MB file. That file holds every CRM screen, the PDF tools and the charts. A website visitor needs maybe a fifth of that.
2. **Moving between CRM pages reloads everything.** Each page rebuilds the sidebar, and the sidebar re-runs its counters (open tickets, late work hours) on every click. That is where the 150,000+ repeat lookups come from.
3. **The orders table loads all orders, all columns, in pages of 1,000.** It then filters them on screen. Status pages like "Invoice Sent" also fetch everything first and filter afterwards.
4. **Invoices list and analytics also load full lists** and do their sums in the browser.

## Improvements (in order of impact, none change features)
1. **Load each page only when it's opened.** The website, the login and each CRM page become separate downloads. The homepage drops from ~1 MB to an estimated 200–300 KB, and the CRM pages load their own part on first open. A small loading bar shows while a page loads.
2. **Keep the sidebar in place between CRM pages** instead of rebuilding it. Its counters then load once and refresh on their timer (every 5 minutes) or right after a change.
3. **Orders table: ask the database for only what is shown.** Status pages request only their status, and the table requests only the columns it displays. The full order loads when you open it, as it does now.
4. **Faster-loading images** on the public pages: smaller modern formats, and images further down the page load only when reached.
5. **Measure again** after each step, with the same page timings plus click-through timings in the CRM. I can't sign in to the CRM from here, so for those I'll use the database stats and ask you to time the dashboard once.

## Technical details
- `React.lazy` + `Suspense` per route in `App.tsx`/`AppImports.tsx`; `manualChunks` for vendor (react, supabase), pdf (jspdf, html2canvas) and charts (recharts).
- A persistent CRM layout route with `<Outlet/>`, so `Sidebar` mounts once. Move ticket and late-count fetches into react-query with `staleTime`.
- `OrderService.getOrdersByStatus` with server-side boolean filters; a column list for table rows; `getOrder(id)` on modal open.
- Public images: `vite-imagetools` webp, `loading="lazy"` below the fold.
