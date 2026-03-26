
-- 1. Fix soft_delete_order - add admin check
CREATE OR REPLACE FUNCTION public.soft_delete_order(order_id_param uuid)
  RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: only admins can delete orders';
  END IF;
  UPDATE public.orders SET status_deleted = true, deleted_at = now(), updated_at = now()
  WHERE id = order_id_param;
END;
$$;

-- 2. Fix restore_order - add admin check
CREATE OR REPLACE FUNCTION public.restore_order(order_id_param uuid)
  RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: only admins can restore orders';
  END IF;
  UPDATE public.orders SET status_deleted = false, deleted_at = NULL, updated_at = now()
  WHERE id = order_id_param;
END;
$$;

-- 3. Fix overly permissive clients table policies
DROP POLICY IF EXISTS "Authenticated users can delete all clients" ON clients;
DROP POLICY IF EXISTS "Authenticated users can update all clients" ON clients;
DROP POLICY IF EXISTS "Users can delete their own clients" ON clients;
DROP POLICY IF EXISTS "Users can update their own clients" ON clients;
DROP POLICY IF EXISTS "Authenticated users can create clients" ON clients;
DROP POLICY IF EXISTS "Users can create clients" ON clients;

-- 4. Fix profile enumeration - replace blanket SELECT with non-client filter
DROP POLICY IF EXISTS "Allow authenticated users to view profile names for rankings" ON profiles;

CREATE POLICY "Non-clients can view all profiles for rankings"
ON profiles FOR SELECT TO authenticated
USING (NOT public.is_client());

-- 5. Fix user_achievements INSERT - restrict to own records
DROP POLICY IF EXISTS "Authenticated can insert achievements" ON user_achievements;

CREATE POLICY "Users can insert own achievements"
ON user_achievements FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- 6. Fix user_audit_logs INSERT - restrict actor_id
DROP POLICY IF EXISTS "Authenticated users can insert logs" ON user_audit_logs;

CREATE POLICY "Users can insert own audit logs"
ON user_audit_logs FOR INSERT TO authenticated
WITH CHECK (actor_id = auth.uid());

-- 7. Fix team_members_view - use app_users instead of auth.users, set SECURITY INVOKER
DROP VIEW IF EXISTS public.team_members_view;

CREATE VIEW public.team_members_view
WITH (security_invoker = true) AS
SELECT p.id, a.email,
  concat_ws(' ', p.first_name, p.last_name) AS full_name
FROM profiles p
LEFT JOIN app_users a ON a.id = p.id
WHERE p.role <> 'client' AND p.disabled = false;

GRANT SELECT ON public.team_members_view TO authenticated;

-- 8. Fix client_orders view - set SECURITY INVOKER
DROP VIEW IF EXISTS public.client_orders;

CREATE VIEW public.client_orders
WITH (security_invoker = true) AS
SELECT o.id,
    o.company_name,
    o.description,
    o.status,
    o.created_at,
    o.updated_at,
    o.price,
    o.currency,
    o.priority,
    o.status_created,
    o.status_in_progress,
    o.status_invoice_sent,
    o.status_invoice_paid,
    o.status_resolved,
    o.status_cancelled,
    o.contact_email,
    o.contact_phone,
    o.client_id,
    o.client_visible_update,
    o.client_action_url,
    c.id AS company_id,
    c.client_user_id,
    c.name AS linked_company_name,
    c.email AS company_email
FROM orders o
LEFT JOIN companies c ON o.company_id = c.id
WHERE o.deleted_at IS NULL AND (o.status_deleted = false OR o.status_deleted IS NULL);
