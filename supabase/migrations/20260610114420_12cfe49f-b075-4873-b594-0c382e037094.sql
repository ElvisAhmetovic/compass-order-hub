
CREATE TABLE public.social_media_checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL CHECK (platform IN ('facebook','abm_website','instagram','tiktok','twitter')),
  checklist_date date NOT NULL,
  title text NOT NULL,
  description text,
  link_url text,
  scheduled_time time,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
  is_done boolean NOT NULL DEFAULT false,
  done_at timestamptz,
  done_by uuid,
  done_note text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX idx_smci_platform_date ON public.social_media_checklist_items(platform, checklist_date);
CREATE INDEX idx_smci_date ON public.social_media_checklist_items(checklist_date);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_media_checklist_items TO authenticated;
GRANT ALL ON public.social_media_checklist_items TO service_role;

ALTER TABLE public.social_media_checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "smci select admin/agent"
  ON public.social_media_checklist_items FOR SELECT
  TO authenticated
  USING (public.is_admin() OR public.get_auth_user_role() IN ('admin','agent'));

CREATE POLICY "smci insert admin/agent"
  ON public.social_media_checklist_items FOR INSERT
  TO authenticated
  WITH CHECK ((public.is_admin() OR public.get_auth_user_role() IN ('admin','agent')) AND created_by = auth.uid());

CREATE POLICY "smci update admin/agent"
  ON public.social_media_checklist_items FOR UPDATE
  TO authenticated
  USING (public.is_admin() OR public.get_auth_user_role() IN ('admin','agent'))
  WITH CHECK (public.is_admin() OR public.get_auth_user_role() IN ('admin','agent'));

CREATE POLICY "smci delete admin or creator"
  ON public.social_media_checklist_items FOR DELETE
  TO authenticated
  USING (public.is_admin() OR created_by = auth.uid());

CREATE TRIGGER trg_smci_updated_at
  BEFORE UPDATE ON public.social_media_checklist_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
