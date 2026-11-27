GRANT DELETE ON public.outreach_replies TO authenticated;
CREATE POLICY "Team can delete outreach replies" ON public.outreach_replies AS PERMISSIVE FOR DELETE TO authenticated USING (public.is_team());

CREATE TABLE public.outreach_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id uuid REFERENCES public.outreach_drafts(id) ON DELETE SET NULL,
  reply_id uuid REFERENCES public.outreach_replies(id) ON DELETE SET NULL,
  to_email text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  sent_by uuid,
  sent_by_name text,
  resend_id text,
  status text NOT NULL DEFAULT 'sent',
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, DELETE ON public.outreach_messages TO authenticated;
GRANT ALL ON public.outreach_messages TO service_role;
ALTER TABLE public.outreach_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team can read outreach messages" ON public.outreach_messages AS PERMISSIVE FOR SELECT TO authenticated USING (public.is_team());
CREATE POLICY "Team can delete outreach messages" ON public.outreach_messages AS PERMISSIVE FOR DELETE TO authenticated USING (public.is_team());
CREATE INDEX outreach_messages_draft_idx ON public.outreach_messages(draft_id);
CREATE INDEX outreach_messages_email_idx ON public.outreach_messages(lower(to_email));