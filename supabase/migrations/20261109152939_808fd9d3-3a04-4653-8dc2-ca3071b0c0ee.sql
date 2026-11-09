CREATE OR REPLACE FUNCTION public.client_owns_order(p_client_id uuid, p_contact_email text, p_company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL
    AND public.has_role(auth.uid(), 'client'::app_role)
    AND (
      p_client_id = auth.uid()
      OR (p_contact_email IS NOT NULL AND p_contact_email <> ''
          AND lower(p_contact_email) = lower(coalesce(auth.jwt() ->> 'email', '')))
      OR (p_company_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.companies c WHERE c.id = p_company_id AND c.client_user_id = auth.uid()))
    )
$$;

REVOKE EXECUTE ON FUNCTION public.client_owns_order(uuid, text, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.client_owns_order(uuid, text, uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "Clients view orders they own" ON public.orders;
CREATE POLICY "Clients view orders they own" ON public.orders
  FOR SELECT TO authenticated
  USING (public.client_owns_order(client_id, contact_email, company_id));

DROP POLICY IF EXISTS "Clients read own order payment links" ON public.order_payment_links;
CREATE POLICY "Clients read own order payment links" ON public.order_payment_links
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o
                 WHERE o.id = order_payment_links.order_id
                   AND public.client_owns_order(o.client_id, o.contact_email, o.company_id)));

DROP POLICY IF EXISTS "Authenticated users can view file attachments" ON public.file_attachments;
DROP POLICY IF EXISTS "Clients can view their order attachments" ON public.file_attachments;
CREATE POLICY "Clients can view their order attachments" ON public.file_attachments
  FOR SELECT TO authenticated
  USING (
    (order_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.orders o
       WHERE o.id = file_attachments.order_id
         AND public.client_owns_order(o.client_id, o.contact_email, o.company_id)))
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'agent'::app_role)
    OR public.has_role(auth.uid(), 'user'::app_role)
    OR auth.uid() = uploaded_by
  );