
CREATE TABLE public.upsell_translations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  upsell_id uuid NOT NULL REFERENCES public.upsells(id) ON DELETE CASCADE,
  language text NOT NULL,
  translated_text text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (upsell_id, language)
);

ALTER TABLE public.upsell_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view translations"
  ON public.upsell_translations FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert translations"
  ON public.upsell_translations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
