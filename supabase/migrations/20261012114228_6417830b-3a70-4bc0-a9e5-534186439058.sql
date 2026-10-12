DROP POLICY "Admins can delete orders" ON public.orders;
CREATE POLICY "Admins can delete orders" ON public.orders FOR DELETE USING ((select public.is_admin()));
DROP POLICY "Admins can manage orders" ON public.orders;
CREATE POLICY "Admins can manage orders" ON public.orders FOR ALL USING ((select public.is_admin()));
DROP POLICY "Clients can view their own orders" ON public.orders;
CREATE POLICY "Clients can view their own orders" ON public.orders FOR SELECT USING (
  ((client_id = (select auth.uid())) AND (select public.has_role(auth.uid(), 'client'::app_role)))
  OR (select public.has_role(auth.uid(), 'admin'::app_role))
  OR (select public.has_role(auth.uid(), 'agent'::app_role))
  OR (select public.has_role(auth.uid(), 'user'::app_role)));
DROP POLICY "Internal users can insert orders" ON public.orders;
CREATE POLICY "Internal users can insert orders" ON public.orders FOR INSERT WITH CHECK (
  (((select auth.uid()) = created_by) AND NOT (select public.has_role(auth.uid(), 'client'::app_role)))
  OR (select public.has_role(auth.uid(), 'admin'::app_role)));
DROP POLICY "Internal users can update orders" ON public.orders;
CREATE POLICY "Internal users can update orders" ON public.orders FOR UPDATE USING (
  (((select auth.uid()) = assigned_to) AND NOT (select public.has_role(auth.uid(), 'client'::app_role)))
  OR (((select auth.uid()) = created_by) AND NOT (select public.has_role(auth.uid(), 'client'::app_role)))
  OR (select public.has_role(auth.uid(), 'admin'::app_role)));
DROP POLICY "Users can view assigned orders" ON public.orders;
CREATE POLICY "Users can view assigned orders" ON public.orders FOR SELECT USING (
  (assigned_to = (select auth.uid())) OR (created_by = (select auth.uid())) OR (select public.is_admin()));
DROP POLICY "Users can view orders based on permissions" ON public.orders;
CREATE POLICY "Users can view orders based on permissions" ON public.orders FOR SELECT USING (EXISTS (
  SELECT 1 FROM public.user_permissions up WHERE up.id = (select auth.uid()) AND (
    (orders.status = 'In Progress' AND up.active_orders_view) OR (orders.status = 'Complaint' AND up.complaints_view)
    OR (orders.status = 'Resolved' AND up.completed_view) OR (orders.status = 'Cancelled' AND up.cancelled_view)
    OR (orders.status = 'Invoice Sent' AND up.invoice_sent_view) OR (orders.status = 'Invoice Paid' AND up.invoice_paid_view)
    OR (orders.status = 'Deleted' AND up.deleted_view) OR (up.role = 'admin'))));
DROP POLICY "Users can view their own orders" ON public.orders;
CREATE POLICY "Users can view their own orders" ON public.orders FOR ALL USING (
  ((select auth.uid()) = created_by) OR ((select auth.uid()) = assigned_to) OR ((select public.get_user_role(auth.uid())) = 'admin'));