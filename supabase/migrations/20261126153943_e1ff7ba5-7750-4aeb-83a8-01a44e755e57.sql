CREATE TABLE public.outreach_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id uuid REFERENCES public.outreach_drafts(id) ON DELETE SET NULL,
  provider_message_id text NOT NULL UNIQUE,
  from_email text NOT NULL,
  from_name text,
  to_address text,
  subject text,
  text_body text,
  html_body text,
  received_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz,
  read_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.outreach_replies TO authenticated;
GRANT ALL ON public.outreach_replies TO service_role;
ALTER TABLE public.outreach_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team can read outreach replies" ON public.outreach_replies FOR SELECT TO authenticated USING (public.is_team());
CREATE POLICY "Team can mark outreach replies read" ON public.outreach_replies FOR UPDATE TO authenticated USING (public.is_team()) WITH CHECK (public.is_team());
CREATE INDEX outreach_replies_received_idx ON public.outreach_replies (received_at DESC);