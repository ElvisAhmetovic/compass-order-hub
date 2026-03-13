-- Remove redundant UPDATE policies on profiles that bypass the protective WITH CHECK
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;