DROP VIEW IF EXISTS public.team_members_view;

CREATE VIEW public.team_members_view
WITH (security_invoker = false) AS
SELECT p.id, u.email,
  concat_ws(' ', p.first_name, p.last_name) AS full_name
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.role <> 'client' AND p.disabled = false;

GRANT SELECT ON public.team_members_view TO authenticated;