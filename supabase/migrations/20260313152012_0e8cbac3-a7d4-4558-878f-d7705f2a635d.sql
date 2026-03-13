-- 1. Companies: Replace broad UPDATE policy with owner/admin scoped
DROP POLICY IF EXISTS "Enable update for authenticated users" ON companies;
CREATE POLICY "Owners and admins can update companies" ON companies
  FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());

-- 2. Clients: Remove broad SELECT policies, add scoped one
DROP POLICY IF EXISTS "Authenticated users can view all clients" ON clients;
DROP POLICY IF EXISTS "Users can view clients" ON clients;

-- 3. Profiles: Harden UPDATE policy with WITH CHECK to prevent role self-escalation
DROP POLICY IF EXISTS "Profiles: allow update for resource owner" ON profiles;
CREATE POLICY "Profiles: allow update for resource owner" ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND (role IS NOT DISTINCT FROM (SELECT role FROM profiles WHERE id = auth.uid())));