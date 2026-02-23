
-- Create customer_tickets table
CREATE TABLE public.customer_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id),
  client_email TEXT NOT NULL,
  client_name TEXT,
  company_name TEXT,
  subject TEXT NOT NULL DEFAULT 'Support Request',
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.customer_tickets ENABLE ROW LEVEL SECURITY;

-- Admins and agents can read all tickets
CREATE POLICY "Admins and agents can view customer tickets"
ON public.customer_tickets FOR SELECT
USING (
  get_auth_user_role() IN ('admin', 'agent')
);

-- Admins and agents can update tickets
CREATE POLICY "Admins and agents can update customer tickets"
ON public.customer_tickets FOR UPDATE
USING (
  get_auth_user_role() IN ('admin', 'agent')
);

-- Admins can delete tickets
CREATE POLICY "Admins can delete customer tickets"
ON public.customer_tickets FOR DELETE
USING (
  get_auth_user_role() = 'admin'
);

-- Open insert for edge function (no auth, service role key used)
CREATE POLICY "Service role can insert customer tickets"
ON public.customer_tickets FOR INSERT
WITH CHECK (true);
