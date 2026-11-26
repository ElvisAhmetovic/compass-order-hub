CREATE OR REPLACE FUNCTION public.is_team()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin','agent'))
$$;

-- Rewrite every "not a client" policy to "is team (admin/agent)"
DO $$
DECLARE r record; q text; c text; stmt text;
BEGIN
  FOR r IN SELECT schemaname, tablename, policyname, qual, with_check FROM pg_policies
           WHERE schemaname = 'public'
             AND (coalesce(qual,'') ~ 'NOT \(?\s*(SELECT )?is_client\(\)' OR coalesce(with_check,'') ~ 'NOT \(?\s*(SELECT )?is_client\(\)')
  LOOP
    q := r.qual; c := r.with_check;
    IF q IS NOT NULL THEN
      q := replace(q, 'NOT ( SELECT is_client() AS is_client)', '( SELECT is_team() AS is_team)');
      q := replace(q, 'NOT is_client()', 'is_team()');
    END IF;
    IF c IS NOT NULL THEN
      c := replace(c, 'NOT ( SELECT is_client() AS is_client)', '( SELECT is_team() AS is_team)');
      c := replace(c, 'NOT is_client()', 'is_team()');
    END IF;
    stmt := format('ALTER POLICY %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    IF q IS NOT NULL THEN stmt := stmt || ' USING (' || q || ')'; END IF;
    IF c IS NOT NULL THEN stmt := stmt || ' WITH CHECK (' || c || ')'; END IF;
    EXECUTE stmt;
  END LOOP;
END $$;

-- New sign-ups can never give themselves a team role through sign-up data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, role)
  VALUES (NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    CASE WHEN NEW.raw_user_meta_data->>'role' = 'client' THEN 'client' ELSE 'user' END);
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.handle_new_user_permissions()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_permissions (id, role)
  VALUES (NEW.id, CASE WHEN NEW.raw_user_meta_data->>'role' = 'client' THEN 'client' ELSE 'user' END);
  RETURN NEW;
END; $$;

-- Keep the one admin whose role was only on the profile
INSERT INTO public.user_roles (user_id, role)
SELECT p.id, 'admin'::app_role FROM public.profiles p
WHERE p.role = 'admin' AND NOT EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = p.id)
ON CONFLICT DO NOTHING;