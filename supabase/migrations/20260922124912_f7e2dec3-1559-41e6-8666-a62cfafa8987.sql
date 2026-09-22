
DROP POLICY IF EXISTS "Team members can view customer tickets" ON public.customer_tickets;
DROP POLICY IF EXISTS "Team members can update customer tickets" ON public.customer_tickets;
CREATE POLICY "Staff can view customer tickets" ON public.customer_tickets
  FOR SELECT TO authenticated USING (NOT public.is_client());
CREATE POLICY "Staff can update customer tickets" ON public.customer_tickets
  FOR UPDATE TO authenticated USING (NOT public.is_client()) WITH CHECK (NOT public.is_client());

DROP POLICY IF EXISTS "Authenticated users can view invoice payment reminders" ON public.invoice_payment_reminders;
DROP POLICY IF EXISTS "Authenticated users can insert invoice payment reminders" ON public.invoice_payment_reminders;
CREATE POLICY "Staff can view invoice payment reminders" ON public.invoice_payment_reminders
  FOR SELECT TO authenticated USING (NOT public.is_client());
CREATE POLICY "Staff can insert invoice payment reminders" ON public.invoice_payment_reminders
  FOR INSERT TO authenticated WITH CHECK (NOT public.is_client());

DROP POLICY IF EXISTS "All users can view invoice sequences" ON public.invoice_sequences;
DROP POLICY IF EXISTS "Authenticated can insert invoice sequences" ON public.invoice_sequences;
DROP POLICY IF EXISTS "Authenticated can update invoice sequences" ON public.invoice_sequences;
CREATE POLICY "Staff can view invoice sequences" ON public.invoice_sequences
  FOR SELECT TO authenticated USING (NOT public.is_client());
CREATE POLICY "Admins can insert invoice sequences" ON public.invoice_sequences
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update invoice sequences" ON public.invoice_sequences
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Profiles: allow insert for resource owner" ON public.profiles;
CREATE POLICY "Profiles: allow insert for resource owner" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id AND (role IS NULL OR role = 'user'));

DROP POLICY IF EXISTS "Users can view files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload files" ON storage.objects;
CREATE POLICY "Staff can view team files" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'team-files' AND NOT public.is_client());
CREATE POLICY "Staff can upload team files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'team-files' AND NOT public.is_client());
