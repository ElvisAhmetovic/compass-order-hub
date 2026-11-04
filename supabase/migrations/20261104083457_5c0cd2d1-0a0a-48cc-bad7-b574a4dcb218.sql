CREATE TABLE public.outreach_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  company_name text,
  language text NOT NULL DEFAULT 'de',
  reason text,
  subject text NOT NULL,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  last_order_at timestamptz,
  past_services text,
  approved_by uuid,
  approved_by_name text,
  sent_at timestamptz,
  error text,
  resend_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX outreach_drafts_email_idx ON public.outreach_drafts (lower(email), created_at DESC);
CREATE UNIQUE INDEX outreach_drafts_one_pending ON public.outreach_drafts (lower(email)) WHERE status = 'pending';
GRANT SELECT, UPDATE ON public.outreach_drafts TO authenticated;
GRANT ALL ON public.outreach_drafts TO service_role;
ALTER TABLE public.outreach_drafts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team can view outreach drafts" ON public.outreach_drafts FOR SELECT TO authenticated USING (NOT public.is_client());
CREATE POLICY "Team can update outreach drafts" ON public.outreach_drafts FOR UPDATE TO authenticated USING (NOT public.is_client()) WITH CHECK (NOT public.is_client());
CREATE TRIGGER outreach_drafts_updated BEFORE UPDATE ON public.outreach_drafts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.outreach_opt_outs (
  email text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.outreach_opt_outs TO authenticated;
GRANT ALL ON public.outreach_opt_outs TO service_role;
ALTER TABLE public.outreach_opt_outs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team can view opt outs" ON public.outreach_opt_outs FOR SELECT TO authenticated USING (NOT public.is_client());

CREATE TABLE public.outreach_scan_lock (
  id int PRIMARY KEY DEFAULT 1,
  locked_until timestamptz NOT NULL DEFAULT now(),
  paused_reason text
);
INSERT INTO public.outreach_scan_lock (id) VALUES (1);
GRANT ALL ON public.outreach_scan_lock TO service_role;
ALTER TABLE public.outreach_scan_lock ENABLE ROW LEVEL SECURITY;