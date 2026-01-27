

# Backend Infrastructure Plan for Client Portal Security

## Current State Analysis

### Existing Implementation
Based on my investigation, the current system has:

1. **Roles stored in `profiles` table** - Currently using `role` column directly in profiles (admin, agent, user, client)
2. **`client_user_id` column in `companies` table** - Already exists, links companies to client users
3. **`client_orders` view** - Already exists with `security_invoker=on`, showing filtered order data
4. **`is_client_of_company()` function** - Security definer function that checks client access
5. **No `user_roles` table** - Roles are stored directly in profiles (security anti-pattern)
6. **No `client_id` on orders table** - Orders link to companies via `company_id`, not directly to clients

### Security Issues Found
1. **Overly permissive RLS on `orders` table** - Multiple policies allow `SELECT` with `qual: true` (anyone can read)
2. **No RLS on `client_orders` view** - Views don't have RLS policies (empty result)
3. **Roles in profiles table** - Best practice is to use a separate `user_roles` table to prevent privilege escalation

---

## Proposed Changes

### Phase 1: Create Proper Role Infrastructure

**1.1 Create `app_role` enum and `user_roles` table**

Following security best practices, we'll create a separate table for roles:

```sql
-- Create enum for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'agent', 'user', 'client');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Index for performance
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
```

**1.2 Create secure `has_role()` function**

```sql
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;
```

**1.3 Create `is_client()` helper function**

```sql
CREATE OR REPLACE FUNCTION public.is_client()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'client'
  )
$$;
```

**1.4 Migrate existing roles to new table**

```sql
-- Copy existing roles from profiles to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, role::app_role
FROM public.profiles
WHERE role IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;
```

---

### Phase 2: Add Direct Client Linking to Orders

**2.1 Add `client_id` column to orders table**

```sql
-- Add client_id to orders for direct client access
ALTER TABLE public.orders
ADD COLUMN client_id UUID REFERENCES auth.users(id);

-- Create index for efficient client lookups
CREATE INDEX idx_orders_client_id ON public.orders(client_id);
```

**2.2 Populate `client_id` from existing company relationships**

```sql
-- Update existing orders with client_id from their linked company
UPDATE public.orders o
SET client_id = c.client_user_id
FROM public.companies c
WHERE o.company_id = c.id
  AND c.client_user_id IS NOT NULL
  AND o.client_id IS NULL;
```

---

### Phase 3: Secure RLS Policies for Orders

**3.1 Remove overly permissive policies**

```sql
-- Drop the dangerous policies that allow anyone to read all orders
DROP POLICY IF EXISTS "Allow select on orders for all" ON public.orders;
DROP POLICY IF EXISTS "Allow users to view orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view orders" ON public.orders;
```

**3.2 Create secure client-specific SELECT policy**

```sql
-- Clients can ONLY read orders where client_id = their user ID
CREATE POLICY "Clients can view their own orders"
  ON public.orders
  FOR SELECT
  USING (
    -- Client can only see orders assigned to them
    (client_id = auth.uid() AND public.has_role(auth.uid(), 'client'))
    -- OR internal users with proper permissions (preserved)
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'agent')
    OR public.has_role(auth.uid(), 'user')
  );
```

**3.3 Ensure clients cannot modify orders**

```sql
-- Explicit deny for client INSERT/UPDATE/DELETE
-- (No policies = no access for operations not covered by existing policies)

-- Keep existing INSERT policy for internal users only
DROP POLICY IF EXISTS "Users can insert orders" ON public.orders;
CREATE POLICY "Internal users can insert orders"
  ON public.orders
  FOR INSERT
  WITH CHECK (
    (auth.uid() = created_by AND NOT public.has_role(auth.uid(), 'client'))
    OR public.has_role(auth.uid(), 'admin')
  );

-- Keep existing UPDATE policy for internal users only  
DROP POLICY IF EXISTS "Users can update assigned orders" ON public.orders;
CREATE POLICY "Internal users can update orders"
  ON public.orders
  FOR UPDATE
  USING (
    (auth.uid() = assigned_to AND NOT public.has_role(auth.uid(), 'client'))
    OR (auth.uid() = created_by AND NOT public.has_role(auth.uid(), 'client'))
    OR public.has_role(auth.uid(), 'admin')
  );
```

---

### Phase 4: RLS Policies for user_roles Table

```sql
-- Only admins can view all roles
CREATE POLICY "Admins can view all roles"
  ON public.user_roles
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Users can view their own roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles
  FOR SELECT
  USING (user_id = auth.uid());

-- Only admins can manage roles
CREATE POLICY "Admins can manage roles"
  ON public.user_roles
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));
```

---

### Phase 5: Update client_orders View

```sql
-- Drop and recreate view to include client_id
DROP VIEW IF EXISTS public.client_orders;

CREATE VIEW public.client_orders WITH (security_invoker=on) AS
SELECT 
    o.id,
    o.company_name,
    o.description,
    o.status,
    o.created_at,
    o.updated_at,
    o.price,
    o.currency,
    o.priority,
    o.status_created,
    o.status_in_progress,
    o.status_invoice_sent,
    o.status_invoice_paid,
    o.status_resolved,
    o.status_cancelled,
    o.contact_email,
    o.contact_phone,
    o.client_id,
    c.id AS company_id,
    c.client_user_id,
    c.name AS linked_company_name,
    c.email AS company_email
FROM orders o
LEFT JOIN companies c ON o.company_id = c.id
WHERE o.deleted_at IS NULL 
  AND (o.status_deleted = false OR o.status_deleted IS NULL);
```

---

### Phase 6: Update AuthContext to Use user_roles Table

The `AuthContext.tsx` needs to be updated to fetch roles from the new `user_roles` table instead of the `profiles` table:

```typescript
// In convertToAuthUser function, change:
const { data: roleData } = await supabase
  .from('user_roles')
  .select('role')
  .eq('user_id', supabaseUser.id)
  .single();

if (roleData) {
  userRole = roleData.role as UserRole;
}
```

---

## Security Summary

| Action | Before | After |
|--------|--------|-------|
| Role Storage | `profiles.role` column | Separate `user_roles` table |
| Role Check Function | `is_admin()` reads profiles | `has_role()` reads user_roles |
| Orders SELECT Policy | `qual: true` (anyone) | `client_id = auth.uid()` for clients |
| Orders INSERT/UPDATE | Available to clients | Blocked for clients |
| Client Access Path | Company → Orders (indirect) | Direct via `client_id` column |

---

## Files to Modify

### Database (Migration)
1. Create `app_role` enum
2. Create `user_roles` table with RLS
3. Create `has_role()` and `is_client()` functions
4. Add `client_id` column to `orders` table
5. Migrate existing roles from profiles
6. Update orders with client_id from companies
7. Drop dangerous RLS policies
8. Create new secure RLS policies
9. Recreate `client_orders` view

### Frontend (Code Changes)
1. **`src/context/AuthContext.tsx`** - Fetch roles from `user_roles` table
2. **`src/services/clientOrderService.ts`** - Use `client_id` filter instead of `client_user_id`
3. **`src/types/index.ts`** - Keep `UserRole` type as-is (already includes 'client')

---

## What Will NOT Change

- Existing admin/agent/user workflows
- UI components (no changes this phase)
- Existing order creation/management for internal users
- Company management features
- All other tables and their RLS policies

