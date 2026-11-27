CREATE TABLE public.outreach_reply_template (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  enabled boolean NOT NULL DEFAULT false,
  subject_en text NOT NULL DEFAULT 'Thanks for your reply',
  body_en text NOT NULL DEFAULT E'Hello {client_name},\n\nthank you for getting back to us. {sender_name} will contact you personally shortly.\n\nKind regards,\nMedia Marketing',
  subject_de text NOT NULL DEFAULT 'Danke für Ihre Rückmeldung',
  body_de text NOT NULL DEFAULT E'Hallo {client_name},\n\nvielen Dank für Ihre Rückmeldung. {sender_name} meldet sich in Kürze persönlich bei Ihnen.\n\nMit freundlichen Grüßen\nMedia Marketing',
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.outreach_reply_template TO authenticated;
GRANT ALL ON public.outreach_reply_template TO service_role;
ALTER TABLE public.outreach_reply_template ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team reads reply template" ON public.outreach_reply_template FOR SELECT TO authenticated USING (public.is_team());
CREATE POLICY "Admins update reply template" ON public.outreach_reply_template FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE TRIGGER outreach_reply_template_updated BEFORE UPDATE ON public.outreach_reply_template FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
INSERT INTO public.outreach_reply_template (id) VALUES (1) ON CONFLICT DO NOTHING;

ALTER TABLE public.outreach_replies ADD COLUMN IF NOT EXISTS followup_sent_at timestamptz, ADD COLUMN IF NOT EXISTS followup_status text;
CREATE UNIQUE INDEX IF NOT EXISTS outreach_replies_one_followup_per_draft ON public.outreach_replies (draft_id) WHERE followup_status = 'sent';