-- Create ticket_attachments table
CREATE TABLE IF NOT EXISTS public.ticket_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.tech_support_tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  width INTEGER,
  height INTEGER,
  original_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS ticket_attachments_ticket_id_idx ON public.ticket_attachments(ticket_id);
CREATE INDEX IF NOT EXISTS ticket_attachments_user_id_idx ON public.ticket_attachments(user_id);

-- Create storage bucket for ticket attachments (private)
INSERT INTO storage.buckets (id, name, public) VALUES ('ticket-attachments', 'ticket-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on ticket_attachments table
ALTER TABLE public.ticket_attachments ENABLE ROW LEVEL SECURITY;

-- RLS policies for ticket_attachments table
CREATE POLICY "Users can view attachments for their tickets"
ON public.ticket_attachments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.tech_support_tickets t
    WHERE t.id = ticket_id AND t.created_by = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role IN ('admin', 'agent')
  )
);

CREATE POLICY "Users can create attachments for their tickets"
ON public.ticket_attachments FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.tech_support_tickets t
    WHERE t.id = ticket_id AND t.created_by = auth.uid()
  )
);

CREATE POLICY "Users can delete their own attachments"
ON public.ticket_attachments FOR DELETE
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role IN ('admin', 'agent')
  )
);

-- Storage RLS policies for ticket-attachments bucket
CREATE POLICY "Users can view their own ticket attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'ticket-attachments' AND
  (
    (storage.foldername(name))[1] IN (
      SELECT t.id::text FROM public.tech_support_tickets t WHERE t.created_by = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'agent')
    )
  )
);

CREATE POLICY "Users can upload attachments to their tickets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'ticket-attachments' AND
  (storage.foldername(name))[1] IN (
    SELECT t.id::text FROM public.tech_support_tickets t WHERE t.created_by = auth.uid()
  )
);

CREATE POLICY "Users can delete their own attachments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'ticket-attachments' AND
  (
    (storage.foldername(name))[1] IN (
      SELECT t.id::text FROM public.tech_support_tickets t WHERE t.created_by = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'agent')
    )
  )
);