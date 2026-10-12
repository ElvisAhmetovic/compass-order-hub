# Speed up orders, statistics and dashboard loading

## What I found
- The orders list is small (about 1,500 orders), so the amount of data isn't the problem. Even so, loading it takes 80 ms on average and up to 4–7 seconds at peak. It has run about 115,000 times.
- **Cause 1 – the access-rule checks repeat for every order.** The orders table has 5 overlapping "who may see this" rules. Each one checks the user's role, or looks up their permissions, separately for each of the 1,500 rows, on every load. That is most of the wait.
- **Cause 2 – the same full list is loaded several times per page.** The dashboard cards, the orders table and the search box each download every order with every column. So do Analytics, Companies and others. One dashboard visit loads the full list 3 times or more.
- **Cause 3 – frequent background refreshes.** Rankings, Personal Stats and Team Challenge reload every 30–60 seconds while open. This happens even in a background tab, and it keeps the database busy for everyone.

## Fix
1. **Faster access checks, with the same rules.** Rewrite the order access rules so the user's role and permissions are checked once per request instead of once per order. Who can see, edit or delete which orders stays exactly the same.
2. **Load the orders list once and share it.** When the dashboard cards, the table and the search box all need it at the same moment, they share a single download. The list is reused for 30 seconds, and it refreshes right away after anyone creates, edits or deletes an order.
3. **Calmer refreshes.** Rankings, statistics and challenges refresh every 2 minutes instead of every 30–60 seconds, and pause when the tab isn't visible. The Refresh button still works instantly.
4. Measure the orders load time before and after, and report the numbers.

## Not changed
- What each person is allowed to see.
- Page layouts and features.

## Technical details
- Migration on `orders` SELECT/UPDATE/ALL policies: wrap `auth.uid()`, `is_admin()`, `has_role(...)`, `get_user_role(...)` in `(select ...)` (initPlan, evaluated once). Use the same in the `user_permissions` EXISTS policy. Add index `user_permissions(id)` if missing. Policy semantics unchanged.
- `OrderService.getOrders`: in-flight request dedupe plus a 30 s cache keyed by args; `clearOrdersCache()` is called from create/update/delete/status-toggle and the realtime handlers.
- `Rankings.tsx`, `UserStatistics.tsx`, `TeamChallenge.tsx`, `PersonalStats.tsx`: `refetchInterval: 120000`, `refetchIntervalInBackground: false`.
- Verify with `EXPLAIN ANALYZE` as an authenticated role, and with `slow_queries` after the change. Unit test for the dedupe/cache invalidation.
