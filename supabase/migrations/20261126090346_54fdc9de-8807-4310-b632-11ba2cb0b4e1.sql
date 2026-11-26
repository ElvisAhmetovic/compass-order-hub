REVOKE EXECUTE ON FUNCTION public.is_team() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_team() TO authenticated, service_role;