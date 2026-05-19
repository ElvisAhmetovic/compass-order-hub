
-- Ensure required extensions
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Remove any prior schedule with the same name
do $$
declare j int;
begin
  select jobid into j from cron.job where jobname = 'send-workhours-daily-reminder';
  if j is not null then perform cron.unschedule(j); end if;
end $$;

-- Schedule every 15 min during 06:00-08:59 UTC, Mon-Fri
-- (covers 07:00-10:59 CET / 08:00-10:59 CEST; edge function gates to 09:30-09:44 Sarajevo)
select cron.schedule(
  'send-workhours-daily-reminder',
  '*/15 6,7,8 * * 1-5',
  $$
  select net.http_post(
    url := 'https://fjybmlugiqmiggsdrkiq.supabase.co/functions/v1/send-workhours-daily-reminder',
    headers := '{"Content-Type":"application/json","apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqeWJtbHVnaXFtaWdnc2Rya2lxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNDYxNjAsImV4cCI6MjA2MDgyMjE2MH0.zdCS-vPtsg15ucfw0HAoNzNLbevhJA3njyLzf_XrzvQ"}'::jsonb,
    body := '{"source":"cron"}'::jsonb
  ) as request_id;
  $$
);
