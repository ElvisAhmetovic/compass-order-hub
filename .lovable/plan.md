

## Fix Email Display in User Management

### Problem
Emails show as "Email not available" because the code tries `supabase.auth.admin.listUsers()` which requires the service role key and always fails from the browser client. The fallback only covers the current user.

### Solution
The `app_users` table already stores emails for users (confirmed by checking the database -- it has email data). Instead of trying the admin API, query `app_users` to get emails.

### Change

| File | Change |
|------|--------|
| `src/pages/UserManagement.tsx` | Replace the `auth.admin.listUsers()` call with a query to `app_users` table. Join profile data with `app_users` emails by matching on `id`. |

### Implementation Detail

In `loadUsers()`, replace lines 41-51 (the `auth.admin.listUsers` block) with a simple query:

```ts
const { data: appUsers } = await supabase
  .from('app_users')
  .select('id, email');
```

Then in the mapping, look up email from `appUsers` instead of `authUsers`:

```ts
const appUser = appUsers?.find(u => u.id === profile.id);
let userEmail = appUser?.email || currentUser?.email || 'Email not available';
```

This removes the dependency on the admin API entirely and uses data that's already available and properly secured by RLS (admins can read `app_users`).

