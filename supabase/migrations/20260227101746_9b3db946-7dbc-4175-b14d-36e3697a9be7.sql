
-- Create upsell_categories table
CREATE TABLE public.upsell_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.upsell_categories ENABLE ROW LEVEL SECURITY;

-- RLS policies: authenticated users can SELECT, INSERT, DELETE
CREATE POLICY "Authenticated users can view upsell categories"
  ON public.upsell_categories FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create upsell categories"
  ON public.upsell_categories FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete upsell categories"
  ON public.upsell_categories FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Add category_id to upsells table
ALTER TABLE public.upsells
  ADD COLUMN category_id UUID REFERENCES public.upsell_categories(id) ON DELETE CASCADE;
