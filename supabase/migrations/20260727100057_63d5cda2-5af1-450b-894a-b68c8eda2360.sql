
-- Perf: dashboard orders list
CREATE INDEX IF NOT EXISTS idx_orders_dashboard_list
  ON public.orders (created_at DESC)
  WHERE deleted_at IS NULL AND status_deleted = false AND is_yearly_package = false;

-- Perf: profiles role filter (used by team lookups)
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles (role);

-- Perf: invoice number search
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON public.invoices (invoice_number);

-- Security: stop exposing auth.users through the team members view.
-- Keep security_invoker=false so all authenticated staff can still read team emails
-- for the assignment dropdowns (matches existing behavior).
DROP VIEW IF EXISTS public.team_members_view;

CREATE VIEW public.team_members_view
WITH (security_invoker = false) AS
SELECT p.id,
       COALESCE(au.email, '') AS email,
       concat_ws(' ', p.first_name, p.last_name) AS full_name
FROM public.profiles p
LEFT JOIN public.app_users au ON au.id = p.id
WHERE p.role <> 'client' AND p.disabled = false;

GRANT SELECT ON public.team_members_view TO authenticated;
