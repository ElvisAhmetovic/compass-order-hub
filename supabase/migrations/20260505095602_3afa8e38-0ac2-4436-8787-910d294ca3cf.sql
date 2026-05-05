
SELECT cron.schedule(
  'monthly-billing-catchup',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url:='https://fjybmlugiqmiggsdrkiq.supabase.co/functions/v1/monthly-billing-catchup',
    headers:='{"Content-Type": "application/json", "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqeWJtbHVnaXFtaWdnc2Rya2lxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNDYxNjAsImV4cCI6MjA2MDgyMjE2MH0.zdCS-vPtsg15ucfw0HAoNzNLbevhJA3njyLzf_XrzvQ"}'::jsonb,
    body:=concat('{"time": "', now(), '"}')::jsonb
  ) as request_id;
  $$
);
