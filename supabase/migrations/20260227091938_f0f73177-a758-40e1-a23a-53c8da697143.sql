
CREATE TABLE public.upsells (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.upsells ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read upsells
CREATE POLICY "Authenticated users can view all upsells"
  ON public.upsells FOR SELECT
  TO authenticated
  USING (true);

-- Users can create their own upsells
CREATE POLICY "Users can create their own upsells"
  ON public.upsells FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Users can update their own upsells
CREATE POLICY "Users can update their own upsells"
  ON public.upsells FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

-- Users can delete their own upsells
CREATE POLICY "Users can delete their own upsells"
  ON public.upsells FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Trigger for updated_at
CREATE TRIGGER update_upsells_updated_at
  BEFORE UPDATE ON public.upsells
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
