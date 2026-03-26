

## Fix: Team Member Selection Broken in Reminders

### Root Cause

The recent security migration recreated `team_members_view` with two changes that broke it:

1. Changed from `JOIN auth.users` to `LEFT JOIN app_users` for email
2. Changed from `security_invoker = false` to `security_invoker = true`

With `security_invoker = true`, the view runs under the calling user's permissions. The `app_users` table has RLS that only lets non-admin users see **their own record**. So when a non-admin user (like Thomas Klein) queries the view, the LEFT JOIN returns `null` emails for everyone except themselves. Since the `<SelectItem value={m.email}>` requires a non-empty string value, items with null emails become unselectable.

This is why "Eldin" (the logged-in user) can be selected but nobody else can.

### Fix

Create a new migration that recreates the view with `security_invoker = false` (the original safe setting). The view is a controlled projection of only `id`, `email`, `full_name` for non-client active users — this is intentionally public to the team and does not need per-user RLS filtering.

Use `auth.users` for the email source (as the original did) since `app_users` has restrictive RLS:

```sql
DROP VIEW IF EXISTS public.team_members_view;

CREATE VIEW public.team_members_view
WITH (security_invoker = false) AS
SELECT p.id, u.email,
  concat_ws(' ', p.first_name, p.last_name) AS full_name
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.role <> 'client' AND p.disabled = false;

GRANT SELECT ON public.team_members_view TO authenticated;
```

### Files to modify
1. **New migration** — Recreate `team_members_view` with `security_invoker = false` and `JOIN auth.users`

