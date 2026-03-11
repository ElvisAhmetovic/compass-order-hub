CREATE POLICY "Non-client authenticated users can delete offers"
ON public.offers FOR DELETE TO authenticated
USING (NOT is_client());