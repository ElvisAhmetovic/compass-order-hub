
CREATE OR REPLACE VIEW public.team_members_view
WITH (security_invoker = false)
AS
SELECT
  p.id,
  u.email,
  CONCAT_WS(' ', p.first_name, p.last_name) AS full_name
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.role != 'client'
  AND p.disabled = false;

GRANT SELECT ON public.team_members_view TO authenticated;
