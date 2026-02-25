
-- Create work_hours table
CREATE TABLE public.work_hours (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  date date NOT NULL,
  start_time text,
  break_time text,
  working_hours numeric,
  end_time text,
  note text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);

-- Enable RLS
ALTER TABLE public.work_hours ENABLE ROW LEVEL SECURITY;

-- Users can view their own entries, admins can view all
CREATE POLICY "Users can view own work hours"
ON public.work_hours FOR SELECT
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'agent'));

-- Users can insert their own entries
CREATE POLICY "Users can insert own work hours"
ON public.work_hours FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own entries, admins can update all
CREATE POLICY "Users can update own work hours"
ON public.work_hours FOR UPDATE
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Users can delete their own entries, admins can delete all
CREATE POLICY "Users can delete own work hours"
ON public.work_hours FOR DELETE
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_work_hours_updated_at
BEFORE UPDATE ON public.work_hours
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
