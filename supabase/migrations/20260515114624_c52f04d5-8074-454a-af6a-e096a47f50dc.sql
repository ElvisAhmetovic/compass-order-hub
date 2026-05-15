CREATE OR REPLACE FUNCTION public.wh_is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT lower(coalesce((auth.jwt() ->> 'email')::text, '')) IN (
    'luciferbebistar@gmail.com',
    'kontakt.abmedia@gmail.com',
    'kleinabmedia@gmail.com',
    'thomas.thomasklein@gmail.com',
    'business@team-abmedia.com'
  );
$$;