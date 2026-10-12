ALTER VIEW public.team_members_view SET (security_invoker = true);
REVOKE ALL ON public.team_members_view FROM anon;
CREATE POLICY "Staff can view team accounts" ON public.app_users FOR SELECT TO authenticated USING (NOT (select public.is_client()));

ALTER FUNCTION public.wh_before_deadline() SET search_path = public;
ALTER FUNCTION public.wh_company_now() SET search_path = public;
ALTER FUNCTION public.wh_company_today() SET search_path = public;

DO $$
DECLARE r record;
  keep text[] := ARRAY['generate_invoice_number','get_auth_user_role','get_user_role','has_role','is_admin','is_client','is_client_of_company','restore_order','soft_delete_order','sync_invoice_status','sync_invoice_status_by_order','update_invoice_with_lines','wh_admin_bulk_set_lock','wh_admin_unlock','wh_admin_upsert','wh_is_super_admin','wh_submit'];
BEGIN
  FOR r IN SELECT p.oid::regprocedure AS sig, p.proname FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.prosecdef LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon', r.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', r.sig);
    IF r.proname = ANY(keep) THEN
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', r.sig);
    ELSE
      EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM authenticated', r.sig);
    END IF;
  END LOOP;
END $$;