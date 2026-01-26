-- Fix remaining RLS Policy "Always True" warnings for INSERT/UPDATE operations

-- 1. Fix orders - overly permissive insert
DROP POLICY IF EXISTS "Allow authenticated users to insert orders" ON public.orders;

-- 2. Fix orders - overly permissive update  
DROP POLICY IF EXISTS "Allow users to update orders" ON public.orders;

-- 3. Fix proposals - public insert access (dangerous!)
DROP POLICY IF EXISTS "Allow public insert access to proposals" ON public.proposals;
CREATE POLICY "Authenticated users can create proposals"
ON public.proposals
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- 4. Fix notifications - system can create with true
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
CREATE POLICY "Authenticated can create notifications"
ON public.notifications
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- 5. Fix invoice_sequences - all users can insert with true
DROP POLICY IF EXISTS "All users can insert invoice sequences" ON public.invoice_sequences;
CREATE POLICY "Authenticated can insert invoice sequences"
ON public.invoice_sequences
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- 6. Fix invoice_sequences - all users can update with true
DROP POLICY IF EXISTS "All users can update invoice sequences" ON public.invoice_sequences;
CREATE POLICY "Authenticated can update invoice sequences"
ON public.invoice_sequences
FOR UPDATE
USING (auth.uid() IS NOT NULL);