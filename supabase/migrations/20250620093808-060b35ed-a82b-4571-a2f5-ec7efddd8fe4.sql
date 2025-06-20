
-- First, let's check what RLS policies exist on invoice_line_items
-- and recreate them to ensure they work properly

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can view line items for their invoices" ON public.invoice_line_items;
DROP POLICY IF EXISTS "Users can insert line items for their invoices" ON public.invoice_line_items;
DROP POLICY IF EXISTS "Users can update line items for their invoices" ON public.invoice_line_items;
DROP POLICY IF EXISTS "Users can delete line items for their invoices" ON public.invoice_line_items;

-- Create a function to check invoice ownership for line items
CREATE OR REPLACE FUNCTION public.user_owns_invoice_for_line_item(invoice_id_param uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.invoices 
    WHERE invoices.id = invoice_id_param 
    AND invoices.user_id = auth.uid()
  );
$$;

-- Recreate policies using the security definer function
CREATE POLICY "Users can view line items for their invoices" 
  ON public.invoice_line_items 
  FOR SELECT 
  USING (public.user_owns_invoice_for_line_item(invoice_id));

CREATE POLICY "Users can insert line items for their invoices" 
  ON public.invoice_line_items 
  FOR INSERT 
  WITH CHECK (public.user_owns_invoice_for_line_item(invoice_id));

CREATE POLICY "Users can update line items for their invoices" 
  ON public.invoice_line_items 
  FOR UPDATE 
  USING (public.user_owns_invoice_for_line_item(invoice_id));

CREATE POLICY "Users can delete line items for their invoices" 
  ON public.invoice_line_items 
  FOR DELETE 
  USING (public.user_owns_invoice_for_line_item(invoice_id));
