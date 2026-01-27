
# Fix Client User Creation - Missing user_roles Entry

## Problem Identified

When creating a client user via the "Add User" modal in User Management:
1. The user is created in `auth.users` (correct)
2. The profile is created/updated in `profiles` table (correct)
3. **No entry is created in `user_roles` table** (BUG!)
4. **No entry is created in `app_users` table** (Missing!)

The `ClientAccessSection` dropdown shows "No clients found" because `getClientUsers()` queries the `user_roles` table, not the `profiles` table.

### Database State Evidence

| Table | Client Entry Exists? |
|-------|---------------------|
| `auth.users` | Yes |
| `profiles` | Yes (role='client') |
| `user_roles` | **No** |
| `app_users` | **No** |

---

## Solution

Update the `create-user` Edge Function to also insert records into:
1. `user_roles` table (required for role-based access control)
2. `app_users` table (required for email lookup)

### Architecture After Fix

```text
Admin creates user via Edge Function
              │
              ▼
┌─────────────────────────────┐
│   auth.admin.createUser()   │
│   → Creates auth.users      │
└─────────────────────────────┘
              │ (trigger fires)
              ▼
┌─────────────────────────────┐
│   profiles table            │
│   (auto-created by trigger) │
└─────────────────────────────┘
              │
              ▼
┌─────────────────────────────┐
│   UPDATE profiles           │  ← Currently done
│   (role, first_name, etc.)  │
└─────────────────────────────┘
              │
              ▼
┌─────────────────────────────┐
│   INSERT INTO user_roles    │  ← MISSING - Need to add
│   (user_id, role)           │
└─────────────────────────────┘
              │
              ▼
┌─────────────────────────────┐
│   INSERT INTO app_users     │  ← MISSING - Need to add
│   (id, email, role, name)   │
└─────────────────────────────┘
```

---

## Implementation

### Modify Edge Function: `supabase/functions/create-user/index.ts`

Add two new database operations after the profile update:

#### 1. Insert into user_roles

```typescript
// Insert role into user_roles table (required for proper role-based access)
const { error: roleInsertError } = await supabaseAdmin
  .from("user_roles")
  .insert({
    user_id: userData.user.id,
    role: role || "user"
  });

if (roleInsertError) {
  console.error("Error inserting user role:", roleInsertError);
}
```

#### 2. Insert into app_users

```typescript
// Insert into app_users table (for email lookup)
const { error: appUserError } = await supabaseAdmin
  .from("app_users")
  .insert({
    id: userData.user.id,
    email: email,
    role: role || "user",
    full_name: `${firstName || ""} ${lastName || ""}`.trim() || null
  });

if (appUserError) {
  console.error("Error inserting app user:", appUserError);
}
```

---

## One-Time Fix for Existing Client

Additionally, we need to fix the existing client user who was already created. This requires a manual SQL insert:

```sql
-- Insert the existing client into user_roles
INSERT INTO user_roles (user_id, role)
VALUES ('d0703084-6885-4525-8b3f-7c5f375e327c', 'client');

-- Insert into app_users if not exists
INSERT INTO app_users (id, email, role, full_name)
SELECT 
  'User''s ID here',
  'client email',
  'client',
  'Doctor Tare'
WHERE NOT EXISTS (
  SELECT 1 FROM app_users WHERE id = 'd0703084-6885-4525-8b3f-7c5f375e327c'
);
```

---

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/create-user/index.ts` | Add INSERT into `user_roles` and `app_users` tables |

---

## Testing After Fix

1. Create a new client user via User Management
2. Open an order's Client Access section
3. Click "Select a client..." dropdown
4. The newly created client should appear in the list

---

## Expected Outcome

After this fix:
- New users created via the Admin modal will have entries in all required tables
- The Client Access dropdown will correctly show all client users
- Role-based access control (RLS policies using `has_role()`) will work correctly
- Email lookups via `app_users` will work correctly
