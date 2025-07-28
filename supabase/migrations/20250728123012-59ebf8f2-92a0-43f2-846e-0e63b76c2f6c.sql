-- Create tech support tickets table
CREATE TABLE public.tech_support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  problem_description TEXT NOT NULL,
  action_needed TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress',
  attachment_url TEXT,
  attachment_name TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_by_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tech_support_tickets ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins and agents can manage tech support tickets"
ON public.tech_support_tickets
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'agent')
  )
);

-- Create trigger for updating updated_at
CREATE TRIGGER update_tech_support_tickets_updated_at
BEFORE UPDATE ON public.tech_support_tickets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();