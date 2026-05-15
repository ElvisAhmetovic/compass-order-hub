# Expand Work Hours super admin access

Grant super-admin access to Work Hours Admin to 5 emails (was 1):

- luciferbebistar@gmail.com (Elvis Ahmetovic)
- kontakt.abmedia@gmail.com (Thomas Klein)
- kleinabmedia@gmail.com (Thomas Klein)
- thomas.thomasklein@gmail.com (Thomas Klein)
- business@team-abmedia.com (Johann Nowak)

## Changes

1. **DB** — migration to update `public.wh_is_super_admin()` to check the email against the 5-email allow-list (lowercased). All RPCs (`wh_submit`, `wh_admin_upsert`, `wh_admin_unlock`) automatically pick up the new list.

2. **Frontend** — update `isSuperAdminEmail()` in `src/services/workHoursV2Service.ts` to match the same 5 emails. Used by `WorkHoursAdmin.tsx` for guard + by sidebar for lock state.

3. **Sidebar** — add a new "Work Hours Admin" link in the existing sidebar:
   - Visible to everyone (so they can see it exists).
   - For the 5 super admins: clickable, navigates to `/admin/work-hours`.
   - For everyone else: rendered as a disabled item with a lock icon and a tooltip "Restricted to authorized admins."
   - Implemented in the existing sidebar component (`src/components/dashboard/Sidebar.tsx`).

No behavior change for workers; only admin reach is widened and discoverability is added.
