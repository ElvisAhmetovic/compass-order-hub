-- Enable Realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Set REPLICA IDENTITY FULL for robust UPDATE payloads
ALTER TABLE public.notifications REPLICA IDENTITY FULL;