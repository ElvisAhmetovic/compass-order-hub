-- Fix Critical RLS Security Issues

-- 1. Drop overly permissive policies on app_users
DROP POLICY IF EXISTS "Allow authenticated users to read all users" ON public.app_users;

-- 2. Create more restrictive policy - users can only see their own record or admins can see all
CREATE POLICY "Users can view own record or admins all"
ON public.app_users
FOR SELECT
USING (
  auth.uid() = id 
  OR is_admin()
);

-- 3. Drop the dangerous public read policy on companies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.companies;

-- 4. Fix comments table - remove public read, require authentication
DROP POLICY IF EXISTS "Users can view all comments" ON public.comments;
CREATE POLICY "Authenticated users can view comments"
ON public.comments
FOR SELECT
USING (auth.role() = 'authenticated');

-- 5. Fix messages table - tighten the overly permissive view policy
DROP POLICY IF EXISTS "Allow message viewing" ON public.messages;

-- 6. Fix reactions table - require authentication to view
DROP POLICY IF EXISTS "Users can view all reactions" ON public.reactions;
CREATE POLICY "Authenticated users can view reactions"
ON public.reactions
FOR SELECT
USING (auth.role() = 'authenticated');

-- 7. Fix file_attachments - require authentication
DROP POLICY IF EXISTS "Users can view file attachments" ON public.file_attachments;
CREATE POLICY "Authenticated users can view file attachments"
ON public.file_attachments
FOR SELECT
USING (auth.role() = 'authenticated');

-- 8. Fix payment_reminders - require authentication instead of true
DROP POLICY IF EXISTS "Authenticated users can view all reminders" ON public.payment_reminders;
CREATE POLICY "Authenticated users can view reminders"
ON public.payment_reminders
FOR SELECT
USING (auth.role() = 'authenticated');