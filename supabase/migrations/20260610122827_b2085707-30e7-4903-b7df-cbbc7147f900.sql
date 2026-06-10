
CREATE TABLE IF NOT EXISTS public.social_media_platform_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL CHECK (platform IN ('facebook','abm_website','instagram','tiktok','twitter')),
  period_type text NOT NULL CHECK (period_type IN ('day','week','month')),
  period_start date NOT NULL,
  period_end date NOT NULL,
  likes integer,
  shares integer,
  comments integer,
  reach integer,
  impressions integer,
  note text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (platform, period_type, period_start)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_media_platform_metrics TO authenticated;
GRANT ALL ON public.social_media_platform_metrics TO service_role;

ALTER TABLE public.social_media_platform_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and agents can view platform metrics"
  ON public.social_media_platform_metrics FOR SELECT
  TO authenticated
  USING (public.is_admin() OR public.get_auth_user_role() IN ('admin','agent'));

CREATE POLICY "Admins and agents can insert platform metrics"
  ON public.social_media_platform_metrics FOR INSERT
  TO authenticated
  WITH CHECK ((public.is_admin() OR public.get_auth_user_role() IN ('admin','agent')) AND created_by = auth.uid());

CREATE POLICY "Admins and agents can update platform metrics"
  ON public.social_media_platform_metrics FOR UPDATE
  TO authenticated
  USING (public.is_admin() OR public.get_auth_user_role() IN ('admin','agent'));

CREATE POLICY "Admins or creators can delete platform metrics"
  ON public.social_media_platform_metrics FOR DELETE
  TO authenticated
  USING (public.is_admin() OR created_by = auth.uid());

CREATE INDEX IF NOT EXISTS idx_smpm_platform_range
  ON public.social_media_platform_metrics(platform, period_start, period_end);

CREATE TRIGGER smpm_set_updated_at
  BEFORE UPDATE ON public.social_media_platform_metrics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
