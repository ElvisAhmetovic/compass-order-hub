
-- Fix invoices RLS: drop restrictive, recreate as permissive
DROP POLICY "Team can manage invoices" ON public.invoices;
DROP POLICY "Team can view invoices" ON public.invoices;

CREATE POLICY "Team can manage invoices" ON public.invoices
AS PERMISSIVE FOR ALL TO authenticated
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'agent'))
WITH CHECK (auth.uid() = user_id OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'agent'));

CREATE POLICY "Team can view invoices" ON public.invoices
AS PERMISSIVE FOR SELECT TO authenticated
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'agent'));

-- Fix invoice_line_items RLS
DROP POLICY "Team can manage invoice line items" ON public.invoice_line_items;
DROP POLICY "Team can view invoice line items" ON public.invoice_line_items;

CREATE POLICY "Team can manage invoice line items" ON public.invoice_line_items
AS PERMISSIVE FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_line_items.invoice_id AND invoices.user_id = auth.uid())
  OR has_role(auth.uid(), 'admin')
  OR has_role(auth.uid(), 'agent')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_line_items.invoice_id AND invoices.user_id = auth.uid())
  OR has_role(auth.uid(), 'admin')
  OR has_role(auth.uid(), 'agent')
);

CREATE POLICY "Team can view invoice line items" ON public.invoice_line_items
AS PERMISSIVE FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_line_items.invoice_id AND invoices.user_id = auth.uid())
  OR has_role(auth.uid(), 'admin')
  OR has_role(auth.uid(), 'agent')
);
