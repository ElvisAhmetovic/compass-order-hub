CREATE TABLE public.outreach_skips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  company_name text,
  reason text NOT NULL,
  details text,
  scanned_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.outreach_skips TO authenticated;
GRANT ALL ON public.outreach_skips TO service_role;
ALTER TABLE public.outreach_skips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team can view outreach skips" ON public.outreach_skips FOR SELECT TO authenticated USING (NOT public.is_client());

CREATE TABLE public.service_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  typical_price text,
  languages text,
  active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_catalog TO authenticated;
GRANT ALL ON public.service_catalog TO service_role;
ALTER TABLE public.service_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team manages service catalog" ON public.service_catalog FOR ALL TO authenticated USING (NOT public.is_client()) WITH CHECK (NOT public.is_client());
CREATE TRIGGER service_catalog_updated_at BEFORE UPDATE ON public.service_catalog FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.service_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name text NOT NULL UNIQUE,
  display_name text,
  order_count integer NOT NULL DEFAULT 0,
  revenue numeric NOT NULL DEFAULT 0,
  revenue_share numeric NOT NULL DEFAULT 0,
  typical_clients text,
  bought_with text,
  confirmed boolean NOT NULL DEFAULT false,
  hidden boolean NOT NULL DEFAULT false,
  computed_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.service_insights TO authenticated;
GRANT ALL ON public.service_insights TO service_role;
ALTER TABLE public.service_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team views insights" ON public.service_insights FOR SELECT TO authenticated USING (NOT public.is_client());
CREATE POLICY "Team edits insights" ON public.service_insights FOR UPDATE TO authenticated USING (NOT public.is_client()) WITH CHECK (NOT public.is_client());