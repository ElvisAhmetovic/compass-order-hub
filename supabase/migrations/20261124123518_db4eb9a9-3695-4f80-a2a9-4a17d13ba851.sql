CREATE TABLE public.assistant_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'New chat',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assistant_threads TO authenticated;
GRANT ALL ON public.assistant_threads TO service_role;
ALTER TABLE public.assistant_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage own assistant threads" ON public.assistant_threads FOR ALL TO authenticated
  USING (user_id = auth.uid() AND public.is_admin()) WITH CHECK (user_id = auth.uid() AND public.is_admin());

CREATE TABLE public.assistant_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.assistant_threads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL,
  content text NOT NULL DEFAULT '',
  parts jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assistant_messages TO authenticated;
GRANT ALL ON public.assistant_messages TO service_role;
ALTER TABLE public.assistant_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read own assistant messages" ON public.assistant_messages FOR SELECT TO authenticated
  USING (user_id = auth.uid() AND public.is_admin());
CREATE INDEX ON public.assistant_messages(thread_id, created_at);

CREATE TABLE public.assistant_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.assistant_threads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  tool text NOT NULL,
  args jsonb NOT NULL DEFAULT '{}'::jsonb,
  summary text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  result jsonb,
  confirmed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.assistant_actions TO authenticated;
GRANT ALL ON public.assistant_actions TO service_role;
ALTER TABLE public.assistant_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read own assistant actions" ON public.assistant_actions FOR SELECT TO authenticated
  USING (user_id = auth.uid() AND public.is_admin());

CREATE TRIGGER assistant_threads_updated BEFORE UPDATE ON public.assistant_threads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER assistant_actions_updated BEFORE UPDATE ON public.assistant_actions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();