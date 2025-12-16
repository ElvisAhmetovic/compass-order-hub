-- Create payment_reminder_logs table for activity tracking
CREATE TABLE public.payment_reminder_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reminder_id UUID REFERENCES public.payment_reminders(id) ON DELETE SET NULL,
  order_id UUID NOT NULL,
  action TEXT NOT NULL, -- 'created', 'updated', 'cancelled', 'sent'
  actor_id UUID,
  actor_name TEXT NOT NULL,
  details JSONB,
  company_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_reminder_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view all logs
CREATE POLICY "Authenticated users can view reminder logs"
  ON public.payment_reminder_logs FOR SELECT
  USING (auth.role() = 'authenticated');

-- Allow users to insert logs
CREATE POLICY "Users can insert reminder logs"
  ON public.payment_reminder_logs FOR INSERT
  WITH CHECK (auth.uid() = actor_id OR actor_id IS NULL);

-- Add index for faster queries
CREATE INDEX idx_payment_reminder_logs_created_at ON public.payment_reminder_logs(created_at DESC);
CREATE INDEX idx_payment_reminder_logs_order_id ON public.payment_reminder_logs(order_id);