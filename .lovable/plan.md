
# Fix "No Clients Found" - Sync Missing user_roles and app_users Entries

## Problem Summary

The client dropdown shows "No clients found" because:

1. The `getClientUsers()` function queries the `user_roles` table for users with `role = 'client'`
2. The existing client "Doctor Tare" (`d0703084-6885-4525-8b3f-7c5f375e327c`) has:
   - Profile in `profiles` table with `role='client'` 
   - Entry in `auth.users` with email `taree@accesshealthcare.com.au`
   - **NO entry in `user_roles`** table
   - **NO entry in `app_users`** table

3. The `is_admin()` database function still checks `profiles.role` instead of `user_roles`, but client-related functions correctly check `user_roles`

## Root Causes

1. **Past Migration Gap**: When the `user_roles` table was created, the migration script only copied roles from profiles where `role IS NOT NULL`. However, the existing client may have been created before the migration, and the migration only ran once.

2. **Edge Function Not Used**: The client was likely created through a different path (not the new `create-user` Edge Function), so the `user_roles` and `app_users` insertions were never executed.

## Solution

### Part 1: Fix the Existing Client (Database Data Fix)

Insert the missing entries for the existing client user:

```sql
-- Insert into user_roles
INSERT INTO public.user_roles (user_id, role)
VALUES ('d0703084-6885-4525-8b3f-7c5f375e327c', 'client')
ON CONFLICT (user_id, role) DO NOTHING;

-- Insert into app_users
INSERT INTO public.app_users (id, email, role, full_name)
VALUES (
  'd0703084-6885-4525-8b3f-7c5f375e327c',
  'taree@accesshealthcare.com.au',
  'client',
  'Doctor Tare'
)
ON CONFLICT (id) DO NOTHING;
```

### Part 2: Modify AssignOrdersModal to Support Client Linking

Update the `AssignOrdersModal` component to set `client_id` instead of `assigned_to` when assigning orders to client users. This ensures:
- Clients get linked via `client_id` (for portal access)
- Internal users continue to use `assigned_to` (for workload assignment)

**File**: `src/components/user-management/AssignOrdersModal.tsx`

**Changes**:
1. Add detection of whether the target user is a client
2. For clients: update `client_id` instead of `assigned_to`
3. Pre-select orders where `client_id === user.id` for clients
4. Update the modal title/description to reflect client linking vs assignment

### Part 3: Update is_admin() Function (Optional Enhancement)

Update the `is_admin()` database function to use `user_roles` instead of `profiles.role` for consistency. This ensures all role checks use the same source of truth.

```sql
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
$$;
```

## Technical Details

### Current Data State (Test Environment)

| Table | Client Entry | Details |
|-------|--------------|---------|
| auth.users | YES | email: taree@accesshealthcare.com.au |
| profiles | YES | first_name: Doctor, last_name: Tare, role: client |
| user_roles | NO | ← MISSING |
| app_users | NO | ← MISSING |

### Client Lookup Flow

```text
getClientUsers()
      │
      ▼
┌─────────────────────────┐
│ Query user_roles        │ ← Returns EMPTY because no 'client' role entries exist
│ WHERE role = 'client'   │
└─────────────────────────┘
      │ (empty array)
      ▼
┌─────────────────────────┐
│ Return "No clients"     │
└─────────────────────────┘
```

### AssignOrdersModal Changes

```text
Current behavior (ALL users):
  - Updates assigned_to field
  - Pre-selects orders where assigned_to === user.id

New behavior:
  IF user role is 'client':
    - Updates client_id field
    - Pre-selects orders where client_id === user.id
  ELSE:
    - Updates assigned_to field (unchanged)
    - Pre-selects orders where assigned_to === user.id (unchanged)
```

## Files to Modify

| File | Change |
|------|--------|
| `src/components/user-management/AssignOrdersModal.tsx` | Add client detection; use `client_id` for clients |

## Database Changes (Data Insert, Not Schema)

Run these SQL statements via Supabase SQL Editor:

```sql
-- Fix existing client: Insert into user_roles
INSERT INTO public.user_roles (user_id, role)
VALUES ('d0703084-6885-4525-8b3f-7c5f375e327c', 'client')
ON CONFLICT (user_id, role) DO NOTHING;

-- Fix existing client: Insert into app_users
INSERT INTO public.app_users (id, email, role, full_name)
VALUES (
  'd0703084-6885-4525-8b3f-7c5f375e327c',
  'taree@accesshealthcare.com.au',
  'client',
  'Doctor Tare'
)
ON CONFLICT (id) DO NOTHING;
```

## Expected Outcome

After these changes:
1. The Order → Client Access dropdown will show "Doctor Tare" as an option
2. The User Management → Assign Orders modal will correctly link orders to clients via `client_id`
3. Future clients created via the Edge Function will automatically have all required entries
4. Role checks will be consistent across the system
