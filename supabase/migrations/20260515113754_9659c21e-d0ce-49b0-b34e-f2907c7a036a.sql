
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove any prior schedule
DO $$ BEGIN
  PERFORM cron.unschedule('wh-auto-lock-every-5min');
EXCEPTION WHEN others THEN NULL; END $$;

SELECT cron.schedule(
  'wh-auto-lock-every-5min',
  '*/5 10-13 * * *',
  $$
  SELECT net.http_post(
    url := 'https://fjybmlugiqmiggsdrkiq.supabase.co/functions/v1/wh-auto-lock',
    headers := '{"Content-Type":"application/json","apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqeWJtbHVnaXFtaWdnc2Rya2lxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNDYxNjAsImV4cCI6MjA2MDgyMjE2MH0.zdCS-vPtsg15ucfw0HAoNzNLbevhJA3njyLzf_XrzvQ"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
