# Give Super Admins Full Work Hours Control

## Problem

The Work Hours Admin page lists multiple super admins in `WH_SUPER_ADMIN_EMAILS` (frontend), but the database function `wh_is_super_admin()` only recognizes **one** email:

```sql
lower(...) = 'luciferbebistar@gmail.com'
```

Every guarded RPC (`wh_admin_upsert`, `wh_admin_unlock`, `wh_admin_bulk_set_lock`, RLS SELECT/DELETE on `work_hours_v2`, audit log SELECT) calls this function. Result: the other super admins pass the frontend `isSuper` check, see the UI, click Save — and the RPC silently rejects with "Only super admin can perform this action". Their edits to past days, today's day, hours, lock/unlock, and "mark as worked" don't stick.

## Fix

Expand `public.wh_is_super_admin()` to match the same email list the frontend uses, so all configured super admins can:

- Edit/insert any user's hours for any date (past, today, future)
- Override locked entries
- Unlock entries
- Bulk lock/unlock
- See all rows and full audit history

No other restriction changes needed — `wh_admin_upsert` already accepts any `p_work_date` and bypasses the deadline; only the gate function is wrong.

## Changes

### 1. Database migration

Replace `public.wh_is_super_admin()` so it returns true for any of:
- `luciferbebistar@gmail.com`
- `kontakt.abmedia@gmail.com`
- `kleinabmedia@gmail.com`
- `thomas.thomasklein@gmail.com`
- `business@team-abmedia.com`

(Same list as `WH_SUPER_ADMIN_EMAILS` in `src/services/workHoursV2Service.ts`.)

Function stays `SECURITY DEFINER STABLE`, reads email from `auth.jwt() ->> 'email'`, lowercased. All existing callers (RPCs + RLS policies) automatically pick up the new behavior — no policy or RPC rewrites needed.

### 2. No frontend changes

`isSuperAdminEmail` already matches the same list, so the UI already shows the admin panel and edit controls to all 5 admins. Once the DB function is aligned, their saves will persist.

## Verification

After migration, sign in as one of the additional super-admin emails (e.g. `kleinabmedia@gmail.com`) and confirm:
1. Editing today's hours for another user saves and reloads correctly.
2. Editing a past day (e.g. last week) for another user saves.
3. Marking a previously "not_worked" past day as worked sticks.
4. Lock/unlock toggles persist.
5. Audit log shows the action under the editor's email.
