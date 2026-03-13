-- Insert missing client roles from profiles into user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'client'::app_role FROM public.profiles 
WHERE role = 'client' 
AND id NOT IN (SELECT user_id FROM public.user_roles)
ON CONFLICT (user_id, role) DO NOTHING;