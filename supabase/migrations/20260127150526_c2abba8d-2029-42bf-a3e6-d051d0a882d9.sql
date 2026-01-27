-- Fix existing client: Insert into user_roles
INSERT INTO public.user_roles (user_id, role)
VALUES ('d0703084-6885-4525-8b3f-7c5f375e327c', 'client')
ON CONFLICT (user_id, role) DO NOTHING;

-- Fix existing client: Insert into app_users
INSERT INTO public.app_users (id, email, role, full_name)
VALUES (
  'd0703084-6885-4525-8b3f-7c5f375e327c',
  'taree@accesshealthcare.com.au',
  'client',
  'Doctor Tare'
)
ON CONFLICT (id) DO NOTHING;

-- Update is_admin() to use user_roles instead of profiles.role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
$$;