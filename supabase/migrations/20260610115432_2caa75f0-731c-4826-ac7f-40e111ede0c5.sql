CREATE TABLE public.social_media_checklist_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL CHECK (platform IN ('facebook','abm_website','instagram','tiktok','twitter')),
  title text NOT NULL,
  description text,
  link_url text,
  scheduled_time time,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
  sort_order integer NOT NULL DEFAULT 0,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_media_checklist_templates TO authenticated;
GRANT ALL ON public.social_media_checklist_templates TO service_role;

ALTER TABLE public.social_media_checklist_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and agents can view templates"
  ON public.social_media_checklist_templates FOR SELECT
  TO authenticated
  USING (public.is_admin() OR public.get_auth_user_role() IN ('admin','agent'));

CREATE POLICY "Admins and agents can insert templates"
  ON public.social_media_checklist_templates FOR INSERT
  TO authenticated
  WITH CHECK ((public.is_admin() OR public.get_auth_user_role() IN ('admin','agent')) AND created_by = auth.uid());

CREATE POLICY "Admins and agents can update templates"
  ON public.social_media_checklist_templates FOR UPDATE
  TO authenticated
  USING (public.is_admin() OR public.get_auth_user_role() IN ('admin','agent'));

CREATE POLICY "Admins or creators can delete templates"
  ON public.social_media_checklist_templates FOR DELETE
  TO authenticated
  USING (public.is_admin() OR created_by = auth.uid());

CREATE INDEX idx_smct_platform ON public.social_media_checklist_templates(platform, sort_order);

CREATE TRIGGER smct_set_updated_at
  BEFORE UPDATE ON public.social_media_checklist_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();