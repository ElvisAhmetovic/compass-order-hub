-- Fix invoice_line_items RLS: allow owner, admin, and agent
DROP POLICY IF EXISTS "Users can manage invoice line items for their invoices" ON public.invoice_line_items;
DROP POLICY IF EXISTS "Users can view invoice line items for their invoices" ON public.invoice_line_items;

CREATE POLICY "Team can view invoice line items" ON public.invoice_line_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_line_items.invoice_id AND invoices.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'agent')
  );

CREATE POLICY "Team can manage invoice line items" ON public.invoice_line_items
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_line_items.invoice_id AND invoices.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'agent')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_line_items.invoice_id AND invoices.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'agent')
  );

-- Fix invoices RLS: consolidate and allow admin/agent access for all operations
DROP POLICY IF EXISTS "Users can create their own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can insert their own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can delete their own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can update their own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can manage their invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can view their invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can view their own invoices" ON public.invoices;

CREATE POLICY "Team can view invoices" ON public.invoices
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'agent')
  );

CREATE POLICY "Team can manage invoices" ON public.invoices
  FOR ALL TO authenticated
  USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'agent')
  )
  WITH CHECK (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'agent')
  );