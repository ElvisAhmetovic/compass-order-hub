ALTER TABLE public.customer_tickets
  ADD COLUMN IF NOT EXISTS message text,
  ADD COLUMN IF NOT EXISTS client_subject text;

DROP POLICY IF EXISTS "Admins and agents can view customer tickets" ON public.customer_tickets;
DROP POLICY IF EXISTS "Admins and agents can update customer tickets" ON public.customer_tickets;

CREATE POLICY "Team members can view customer tickets"
ON public.customer_tickets FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Team members can update customer tickets"
ON public.customer_tickets FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

GRANT SELECT, UPDATE ON public.customer_tickets TO authenticated;
GRANT ALL ON public.customer_tickets TO service_role;