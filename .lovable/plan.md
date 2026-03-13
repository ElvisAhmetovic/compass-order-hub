

## Fix 3 Security Findings

### 1. Companies — Unrestricted UPDATE (CRITICAL)
Replace the permissive `auth.role() = 'authenticated'` UPDATE policy with one scoped to record owners and admins.

```sql
DROP POLICY "Enable update for authenticated users" ON companies;
CREATE POLICY "Owners and admins can update companies" ON companies
  FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());
```

### 2. Clients — All Records Readable (CRITICAL)
Remove the two broad SELECT policies and keep only scoped ones (owner + admin/agent).

```sql
DROP POLICY IF EXISTS "Authenticated users can view all clients" ON clients;
DROP POLICY IF EXISTS "Users can view clients" ON clients;
CREATE POLICY "Users can view own clients" ON clients
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
```

### 3. Profiles — Role Self-Escalation (ALREADY PARTIALLY FIXED)
The `prevent_role_change` trigger was deployed in the last migration, which silently reverts role changes by non-admins. However, the scanner flags the RLS policy itself. To satisfy the scanner and add defense-in-depth at the RLS layer, add a `WITH CHECK` that prevents role changes:

```sql
DROP POLICY IF EXISTS "Profiles: allow update for resource owner" ON profiles;
CREATE POLICY "Profiles: allow update for resource owner" ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND (role IS NOT DISTINCT FROM (SELECT role FROM profiles WHERE id = auth.uid())));
```

This ensures even at the RLS level, a user cannot change their own role column — the trigger is a backup.

### Files
- Database migration only (no code changes needed)

