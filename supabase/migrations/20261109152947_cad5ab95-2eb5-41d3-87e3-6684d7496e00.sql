REVOKE EXECUTE ON FUNCTION public.client_owns_order(uuid, text, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.client_owns_order(uuid, text, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.client_owns_order(uuid, text, uuid) TO authenticated, service_role;