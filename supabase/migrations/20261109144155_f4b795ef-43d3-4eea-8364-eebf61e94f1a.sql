CREATE OR REPLACE FUNCTION public.portal_status_for_emails(p_emails text[])
RETURNS TABLE(email text, has_account boolean, last_sign_in_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT lower(e) AS email,
         (au.id IS NOT NULL) AS has_account,
         u.last_sign_in_at
  FROM unnest(p_emails) AS e
  LEFT JOIN public.app_users au ON lower(au.email) = lower(e) AND au.role = 'client'
  LEFT JOIN auth.users u ON u.id = au.id
  WHERE EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role IN ('admin','agent','user'));
$$;
REVOKE ALL ON FUNCTION public.portal_status_for_emails(text[]) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.portal_status_for_emails(text[]) TO authenticated;