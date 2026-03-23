CREATE POLICY "Non-client authenticated users can update offers"
ON public.offers FOR UPDATE TO authenticated
USING (NOT is_client())
WITH CHECK (NOT is_client());