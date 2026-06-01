-- 1. Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Schedule the daily expiration check
-- This runs every day at 1:00 AM UTC
-- IMPORTANT: Replace 'YOUR_SERVICE_ROLE_KEY' with your actual Supabase Service Role Key.
-- This key is required to authenticate the request to your Edge Function.

SELECT cron.schedule(
  'check-expirations-daily',
  '0 1 * * *',
  $$
  SELECT net.http_post(
    url := 'https://gquhrewpuxzjlexghsio.supabase.co/functions/v1/check-expirations',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxdWhyZXdwdXh6amxleGdoc2lvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTk3NzkyNSwiZXhwIjoyMDg1NTUzOTI1fQ.SRUl6Mkr_C7i_9aohf5W7cT-kMVYUGb_6J4BTC8NKug'
    ),
    body := '{}'::jsonb
  ) as request_id;
  $$
);

-- Note: To monitor your cron jobs, you can use:
-- SELECT * FROM cron.job;
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC;
