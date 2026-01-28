-- Create table to track read status for support inquiries
CREATE TABLE public.support_reply_reads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  inquiry_id UUID NOT NULL REFERENCES support_inquiries(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, inquiry_id)
);

-- Enable RLS
ALTER TABLE public.support_reply_reads ENABLE ROW LEVEL SECURITY;

-- Users can manage their own read status
CREATE POLICY "Users can view own read status"
  ON public.support_reply_reads
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own read status"
  ON public.support_reply_reads
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own read status"
  ON public.support_reply_reads
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own read status"
  ON public.support_reply_reads
  FOR DELETE
  USING (auth.uid() = user_id);