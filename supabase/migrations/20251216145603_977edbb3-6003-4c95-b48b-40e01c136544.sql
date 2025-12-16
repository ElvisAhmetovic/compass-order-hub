-- Create client_email_logs table to track all client payment reminder emails
CREATE TABLE public.client_email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  sent_to TEXT NOT NULL,
  sent_by UUID,
  sent_by_name TEXT NOT NULL,
  company_name TEXT NOT NULL,
  order_price NUMERIC,
  currency TEXT DEFAULT 'EUR',
  custom_message TEXT,
  team_emails_sent INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.client_email_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Authenticated users can view client email logs"
ON public.client_email_logs
FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert client email logs"
ON public.client_email_logs
FOR INSERT
WITH CHECK (auth.uid() = sent_by OR sent_by IS NULL);

-- Create index for faster lookups by order_id
CREATE INDEX idx_client_email_logs_order_id ON public.client_email_logs(order_id);