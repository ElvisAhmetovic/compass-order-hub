
# Fix User Creation in User Management

## Problem Identified

The error `"insert or update on table 'profiles' violates foreign key constraint 'profiles_id_fkey'"` occurs because:

1. The `profiles` table has a foreign key constraint that requires the `id` to exist in `auth.users` first
2. The current `AddUserModal` tries to create a profile with a random UUID that doesn't exist in `auth.users`
3. This is the wrong approach - you cannot create a profile without first creating an auth user

## Root Cause

```
profiles.id → auth.users.id (FOREIGN KEY)
```

When a user registers through Supabase Auth, a trigger (`handle_new_user`) automatically creates their profile. The current modal bypasses this flow entirely.

---

## Solution

Create a new Edge Function that uses the Supabase Admin API to properly create users, similar to `create-admin-user` but for any role.

### Architecture

```text
Admin clicks "Add User"
       │
       ▼
┌─────────────────────┐
│   AddUserModal      │
│   (collect info)    │
└─────────────────────┘
       │
       ▼
┌─────────────────────┐
│  Edge Function      │
│  create-user        │
│  (uses Admin API)   │
└─────────────────────┘
       │
       ▼
┌─────────────────────┐
│  auth.users         │
│  (user created)     │
└─────────────────────┘
       │ (trigger fires)
       ▼
┌─────────────────────┐
│  profiles table     │
│  (auto-created)     │
└─────────────────────┘
       │
       ▼
┌─────────────────────┐
│  Update profile     │
│  with role + name   │
└─────────────────────┘
```

---

## Implementation Steps

### 1. Create New Edge Function: `create-user`

Create `supabase/functions/create-user/index.ts`:

- Accept: email, password, firstName, lastName, role
- Use `supabase.auth.admin.createUser()` to create the auth user
- User metadata will trigger profile creation
- Update the profile with the specified role
- Return success with user details

### 2. Update AddUserModal

Modify `src/components/user-management/AddUserModal.tsx`:

- Add a password field (required for user creation)
- Call the `create-user` Edge Function instead of direct profile insert
- Show appropriate feedback on success/error

### 3. Update UserManagement Page

Modify `src/pages/UserManagement.tsx`:

- Remove the direct profile insert in `handleAddUser`
- The modal will handle the API call directly
- Just reload users after successful creation

---

## Technical Details

### Edge Function Implementation

```typescript
// Key parts of create-user Edge Function
const { data: userData, error: userError } = 
  await supabaseAdmin.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true, // Auto-confirm email
    user_metadata: {
      first_name: firstName,
      last_name: lastName,
      role: role
    }
  });

// Profile is auto-created by trigger
// Then update with correct role
await supabaseAdmin
  .from("profiles")
  .update({ 
    role: role,
    first_name: firstName,
    last_name: lastName 
  })
  .eq("id", userData.user.id);
```

### Updated Modal Form

The modal will now include:
- Email field (existing)
- Password field (new - required)
- Full Name field (existing)
- Role selector (existing)

---

## Security Considerations

1. **Admin-only access**: The Edge Function will verify the caller is an admin before creating users
2. **Password requirements**: Enforce minimum 8 characters
3. **Service role key**: Used only in the Edge Function (server-side)
4. **No client-side admin API**: All admin operations go through the Edge Function

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `supabase/functions/create-user/index.ts` | Create | New Edge Function for user creation |
| `src/components/user-management/AddUserModal.tsx` | Modify | Add password field, call Edge Function |
| `src/pages/UserManagement.tsx` | Modify | Simplify handleAddUser to just reload |
| `supabase/config.toml` | Modify | Register new Edge Function |

---

## Expected Outcome

After this fix:
1. Admins can create new users with any role (user, admin, agent, client)
2. Users are properly created in `auth.users` first
3. Profiles are auto-created via the existing trigger
4. The new user can immediately log in with the provided credentials
5. No more foreign key constraint errors
