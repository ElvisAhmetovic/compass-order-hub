-- Fix the overly permissive proposals RLS policy
-- Drop the insecure policy that allows public read access
DROP POLICY IF EXISTS "Allow public read access to proposals" ON public.proposals;

-- Create proper policy: Users can only view their own proposals or admins can view all
CREATE POLICY "Users can view their own proposals"
  ON public.proposals
  FOR SELECT
  USING (auth.uid() = user_id OR is_admin());

-- Also add policy for admins to manage all proposals
CREATE POLICY "Admins can manage all proposals"
  ON public.proposals
  FOR ALL
  USING (is_admin());