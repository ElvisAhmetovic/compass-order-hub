
-- Drop the overly permissive service role policy and replace with a scoped one
DROP POLICY "Service role can manage monthly installments" ON public.monthly_installments;

-- The edge function uses service_role key which bypasses RLS entirely,
-- so we don't need an extra policy. The existing authenticated policies are sufficient.
