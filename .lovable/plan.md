

## Fix: Show All Admin Team Members in Assignee Dropdown

### Problem
The Reminders page queries the `app_users` table for team members, but that table only contains 2 non-client entries (Amir and Eldin). The actual team (14 admins) lives in the `profiles` table, which doesn't have an `email` column — emails are only in `auth.users`, which can't be queried from the client.

### Solution
Create a database view `team_members_view` that joins `profiles` with `auth.users` to expose non-client team members with their emails. Then update the Reminders page to query this view instead of `app_users`.

### Changes

**1. Database migration** — Create a security-definer view
```sql
CREATE OR REPLACE VIEW public.team_members_view AS
SELECT 
  p.id,
  u.email,
  CONCAT_WS(' ', p.first_name, p.last_name) AS full_name
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.role != 'client'
  AND (p.disabled IS NULL OR p.disabled = false);
```
Grant SELECT to authenticated. Add RLS-compatible security via a wrapper function if needed (views on auth.users require `security_invoker = false` which is the default, so this will work).

**2. `src/pages/Reminders.tsx`** — Update `fetchTeamMembers`
- Change query from `supabase.from('app_users')` to `supabase.from('team_members_view')`
- Remove the `.neq('role', 'client')` filter (already handled by the view)
- The response shape (`id, email, full_name`) stays the same, so no other UI changes needed

