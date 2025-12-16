-- Create payment_reminders table
CREATE TABLE public.payment_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  remind_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'sent', 'cancelled')),
  note TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_by_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sent_at TIMESTAMP WITH TIME ZONE
);

-- Create index for efficient cron queries
CREATE INDEX idx_payment_reminders_status_remind_at ON public.payment_reminders(status, remind_at);
CREATE INDEX idx_payment_reminders_order_id ON public.payment_reminders(order_id);

-- Enable RLS
ALTER TABLE public.payment_reminders ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view all reminders"
ON public.payment_reminders
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create reminders"
ON public.payment_reminders
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update reminders they created or admins"
ON public.payment_reminders
FOR UPDATE
TO authenticated
USING (auth.uid() = created_by OR is_admin());

CREATE POLICY "Users can delete reminders they created or admins"
ON public.payment_reminders
FOR DELETE
TO authenticated
USING (auth.uid() = created_by OR is_admin());

-- Trigger for updated_at
CREATE TRIGGER update_payment_reminders_updated_at
BEFORE UPDATE ON public.payment_reminders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();