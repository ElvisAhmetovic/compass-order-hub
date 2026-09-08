-- Companies: internal team sees all, clients only their own linked company
DROP POLICY IF EXISTS "Authenticated users can view companies" ON public.companies;
CREATE POLICY "Team can view companies, clients only their own"
ON public.companies FOR SELECT TO authenticated
USING (
  (NOT public.is_client())
  OR client_user_id = auth.uid()
);

-- Payment reminders: internal only
DROP POLICY IF EXISTS "Authenticated users can view reminders" ON public.payment_reminders;
CREATE POLICY "Team can view reminders"
ON public.payment_reminders FOR SELECT TO authenticated
USING (NOT public.is_client());

-- Email templates: internal only
DROP POLICY IF EXISTS "Authenticated users can view email templates" ON public.email_templates;
CREATE POLICY "Team can view email templates"
ON public.email_templates FOR SELECT TO authenticated
USING (NOT public.is_client());
DROP POLICY IF EXISTS "Authenticated users can create email templates" ON public.email_templates;
CREATE POLICY "Team can create email templates"
ON public.email_templates FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL AND NOT public.is_client());

-- Inventory: never visible to clients
DROP POLICY IF EXISTS "Users can view inventory" ON public.inventory_items;
CREATE POLICY "Users can view inventory"
ON public.inventory_items FOR SELECT TO authenticated
USING ((NOT public.is_client()) AND ((auth.uid() = user_id) OR public.is_admin() OR (user_id IS NULL)));

-- Team members view: hide from clients
CREATE OR REPLACE VIEW public.team_members_view AS
 SELECT p.id,
    COALESCE(au.email, ''::text) AS email,
    concat_ws(' '::text, p.first_name, p.last_name) AS full_name
   FROM public.profiles p
     LEFT JOIN public.app_users au ON au.id = p.id
  WHERE p.role <> 'client'::text AND p.disabled = false
    AND NOT public.is_client();