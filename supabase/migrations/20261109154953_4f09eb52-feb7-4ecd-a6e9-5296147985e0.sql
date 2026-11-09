CREATE TABLE public.client_portal_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  user_email text,
  event text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX client_portal_activity_created_idx ON public.client_portal_activity (created_at DESC);
CREATE INDEX client_portal_activity_user_idx ON public.client_portal_activity (user_id, created_at DESC);
GRANT SELECT, INSERT ON public.client_portal_activity TO authenticated;
GRANT ALL ON public.client_portal_activity TO service_role;
ALTER TABLE public.client_portal_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients log their own portal activity" ON public.client_portal_activity
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.is_client()
    AND event IN ('login','logout','password_reset_requested','pay_clicked','invoice_filter','document_downloaded','package_cancelled','ticket_created','language_changed','load_failed','page_view'));
CREATE POLICY "Team views portal activity" ON public.client_portal_activity
  FOR SELECT TO authenticated
  USING (public.is_admin() OR public.has_role(auth.uid(), 'agent'));