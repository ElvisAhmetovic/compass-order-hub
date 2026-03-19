
-- Create follow_up_reminders table
CREATE TABLE public.follow_up_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  contact_phone TEXT,
  note TEXT NOT NULL,
  remind_at TIMESTAMPTZ NOT NULL,
  assignee_email TEXT NOT NULL,
  assignee_name TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by_name TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled',
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add reminder_id to file_attachments
ALTER TABLE public.file_attachments ADD COLUMN IF NOT EXISTS reminder_id UUID REFERENCES public.follow_up_reminders(id) ON DELETE CASCADE;

-- Create index for cron query
CREATE INDEX idx_follow_up_reminders_status_remind_at ON public.follow_up_reminders(status, remind_at);
CREATE INDEX idx_file_attachments_reminder_id ON public.file_attachments(reminder_id);

-- Enable RLS
ALTER TABLE public.follow_up_reminders ENABLE ROW LEVEL SECURITY;

-- RLS: Non-client authenticated users can do everything
CREATE POLICY "Non-client users can view reminders"
  ON public.follow_up_reminders FOR SELECT
  TO authenticated
  USING (NOT public.is_client());

CREATE POLICY "Non-client users can create reminders"
  ON public.follow_up_reminders FOR INSERT
  TO authenticated
  WITH CHECK (NOT public.is_client());

CREATE POLICY "Non-client users can update reminders"
  ON public.follow_up_reminders FOR UPDATE
  TO authenticated
  USING (NOT public.is_client());

CREATE POLICY "Non-client users can delete reminders"
  ON public.follow_up_reminders FOR DELETE
  TO authenticated
  USING (NOT public.is_client());
