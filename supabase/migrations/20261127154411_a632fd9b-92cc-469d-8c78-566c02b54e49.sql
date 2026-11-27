CREATE TABLE public.assistant_knowledge (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic text NOT NULL DEFAULT 'general',
  content text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  source_thread_id uuid,
  created_by uuid,
  created_by_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assistant_knowledge TO authenticated;
GRANT ALL ON public.assistant_knowledge TO service_role;
ALTER TABLE public.assistant_knowledge ENABLE ROW LEVEL SECURITY;
CREATE INDEX assistant_knowledge_active_idx ON public.assistant_knowledge (active, updated_at DESC);
CREATE POLICY "Team reads knowledge" ON public.assistant_knowledge FOR SELECT TO authenticated USING (public.is_team());
CREATE POLICY "Team adds knowledge" ON public.assistant_knowledge FOR INSERT TO authenticated WITH CHECK (public.is_team());
CREATE POLICY "Team edits knowledge" ON public.assistant_knowledge FOR UPDATE TO authenticated USING (public.is_team()) WITH CHECK (public.is_team());
CREATE POLICY "Admins delete knowledge" ON public.assistant_knowledge FOR DELETE TO authenticated USING (public.is_admin());
CREATE TRIGGER assistant_knowledge_updated_at BEFORE UPDATE ON public.assistant_knowledge FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();