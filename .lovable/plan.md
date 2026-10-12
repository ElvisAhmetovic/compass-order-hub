# Clean up the 80 database warnings without breaking anything

## What the 80 warnings are
| Warning | Count | What it means |
|---|---|---|
| Team list view runs with owner rights | 1 | The team list on the Reminders page skips the normal access rules |
| Missing safety setting on time functions | 3 | Three work-hours time helpers lack a fixed lookup path |
| Built-in database functions callable without signing in | 37 | Anyone, even signed out, may call them |
| Same functions callable by signed-in users | 37 | Any signed-in user may call them |
| Web-request add-on in the main area | 1 | The tool the scheduled jobs use to send web requests sits in the main area |
| Database version has updates | 1 | The database software has security updates available |

## What I will fix
1. **Team list view:** switch it to follow normal access rules. Today only admins can read other team members' email addresses, so I'll add one rule letting staff (not clients) read team emails. Otherwise the reminder assignee list on the Reminders page would lose its emails. Staff can already see all team names today, so nothing new opens up to clients.
2. **3 time helpers:** add the missing safety setting. Their results don't change.
3. **Signed-out access (37):** remove it from every one of these functions. Nothing in the app calls them while signed out. Public pages, the contact form and offer confirmation all go through server functions with full rights, and the scheduled jobs do too.
4. **Signed-in access (37):** remove it from the 16 functions that only run automatically when data changes (timestamps, invoice totals, new-user setup) and from functions the app never calls.

## What stays on purpose (I'll mark these as reviewed)
- **Signed-in access for about 17 functions the CRM needs.** That means the role checks behind every access rule (is admin, is client, role lookup) and the actions the app calls directly: invoice numbers, invoice saving and status sync, order delete/restore, work-hours submit and admin edits. Each already checks the caller's role inside. Removing access would break saving invoices, work hours and every protected page.
- **The web-request add-on:** it can't be moved without reinstalling it, which would break the scheduled reminder, billing and work-hours jobs.
- **Database version update:** you start this yourself in the Supabase dashboard (a short restart). I can't run it from here.

Result: about 60 of the 80 warnings disappear. The remaining ~20 are intentional, and I'll list each one with its reason.

## Checks so nothing breaks
- Before and after, run signed-out requests against the main tables and the public offer/contact functions: they must behave exactly as before, with no new "permission denied" errors.
- Confirm that each function the app calls is still callable when signed in.
- Run all project tests and check the build.
- **Speed:** compare the orders load times in the database stats with this morning's (80 ms average / 4–7 s peak), and report the numbers.

## Technical details
- `ALTER VIEW public.team_members_view SET (security_invoker = true)`; new `app_users` SELECT policy `TO authenticated USING (NOT (select public.is_client()))`.
- `ALTER FUNCTION wh_before_deadline/wh_company_now/wh_company_today SET search_path = public`.
- `REVOKE EXECUTE ... FROM anon, public` on all 37; `REVOKE ... FROM authenticated` on trigger functions plus `get_order_status_history`, `recalculate_invoice_totals`, `wh_auto_lock_today` (service role only); keep authenticated on RLS helpers and the RPCs used in code (`generate_invoice_number`, `sync_invoice_status*`, `update_invoice_with_lines`, `soft_delete_order`, `restore_order`, `wh_submit`, `wh_admin_*`, `is_client_of_company`, `wh_is_super_admin`). Grep for `get_order_status_history` usage before revoking.
- `service_role` keeps EXECUTE on everything.
