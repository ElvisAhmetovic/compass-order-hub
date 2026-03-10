
CREATE TABLE public.sidebar_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hidden_items text[] NOT NULL DEFAULT '{}',
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.sidebar_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read sidebar config"
  ON public.sidebar_config FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can update sidebar config"
  ON public.sidebar_config FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

INSERT INTO public.sidebar_config (hidden_items) VALUES ('{}');
