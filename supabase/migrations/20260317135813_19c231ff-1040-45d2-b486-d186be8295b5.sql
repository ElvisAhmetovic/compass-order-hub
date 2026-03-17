
-- Create invoice_payment_reminders table
CREATE TABLE public.invoice_payment_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  order_id uuid NOT NULL,
  reminder_number integer NOT NULL DEFAULT 1,
  sent_at timestamptz NOT NULL DEFAULT now(),
  sent_to_client text,
  sent_to_team boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Add reminder tracking columns to invoices
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS reminder_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_reminder_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS next_reminder_at timestamptz;

-- Enable RLS
ALTER TABLE public.invoice_payment_reminders ENABLE ROW LEVEL SECURITY;

-- RLS policies for invoice_payment_reminders
CREATE POLICY "Authenticated users can view invoice payment reminders"
  ON public.invoice_payment_reminders FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert invoice payment reminders"
  ON public.invoice_payment_reminders FOR INSERT TO authenticated WITH CHECK (true);

-- Index for cron query performance
CREATE INDEX idx_invoices_next_reminder_at ON public.invoices (next_reminder_at) WHERE next_reminder_at IS NOT NULL;
CREATE INDEX idx_invoice_payment_reminders_invoice_id ON public.invoice_payment_reminders (invoice_id);
