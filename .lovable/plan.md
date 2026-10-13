# Faster orders on the dashboard

## How it works today
The dashboard already shows 30 orders per page. But when it opens, it downloads all of your orders (about 1,400) and only then splits them into pages 1, 2, 3 and so on. Showing 20 instead of 30 per page would barely help, because all 1,400 are still downloaded every time.

## Fix: download only the page you are looking at
1. The dashboard loads only the 25 orders on the current page from the server. Clicking page 2 or 3 loads the next 25.
2. Search, status filters (Created, In Progress, Invoice Sent...), date filters and sorting run on the server, so results stay correct across all orders, not just the visible page.
3. The page numbers and "x orders" total come from a quick count on the server.
4. The status cards and counters at the top keep their correct numbers through a separate lightweight count. They no longer need the full list.
5. After you edit, create or delete an order, the current page refreshes straight away.
6. Before and after, I measure the dashboard opening time and the data size.

## What stays the same
- The look of the table, the buttons, and the order detail windows.
- Yearly packages and deleted orders pages work as before.

## Technical notes
- `OrderService.getOrdersPage({ page, pageSize: 25, filters, search, sort })` uses `.range()` with `count: 'exact'`. The search covers company name, contact name, email and phone via `.or(ilike...)`.
- `OrderTable` switches from a client-side `slice` to server paging. The 30-second cache is keyed by page and filters.
- The status counts come from a `get_order_status_counts()` RPC (security invoker, so it follows the same access rules).
- Screens that truly need every order (exports, statistics) keep using `getOrders()`.
