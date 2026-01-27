-- Fix 1: Remove overly permissive "Users can view all tasks" policy
DROP POLICY IF EXISTS "Users can view all tasks" ON public.tasks;

-- Create proper RLS policy for tasks - only allow viewing tasks assigned to user or if admin/agent
CREATE POLICY "Users can view tasks they are involved with"
ON public.tasks
FOR SELECT
USING (
  auth.uid() = assigned_to 
  OR auth.uid() = assigned_by 
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'agent'::app_role)
);

-- Fix 2: Drop overly permissive client_email_logs SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view client email logs" ON public.client_email_logs;

-- Create restrictive policy - only non-client authenticated users can view
CREATE POLICY "Non-client users can view client email logs"
ON public.client_email_logs
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND NOT is_client()
);