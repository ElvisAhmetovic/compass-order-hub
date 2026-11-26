SELECT vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), 'reminder_cron_secret', 'Pass for the automatic invoice reminder job')
WHERE NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'reminder_cron_secret');

CREATE OR REPLACE FUNCTION public.verify_reminder_cron_secret(p_secret text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, vault AS $$
  SELECT p_secret IS NOT NULL AND length(p_secret) > 0 AND EXISTS (
    SELECT 1 FROM vault.decrypted_secrets WHERE name = 'reminder_cron_secret' AND decrypted_secret = p_secret)
$$;
REVOKE EXECUTE ON FUNCTION public.verify_reminder_cron_secret(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_reminder_cron_secret(text) TO service_role;