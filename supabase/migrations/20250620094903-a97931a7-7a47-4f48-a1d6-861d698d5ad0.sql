
-- Disable RLS on invoice_line_items table completely
ALTER TABLE public.invoice_line_items DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies on line items
DROP POLICY IF EXISTS "Users can view line items for their invoices" ON public.invoice_line_items;
DROP POLICY IF EXISTS "Users can insert line items for their invoices" ON public.invoice_line_items;
DROP POLICY IF EXISTS "Users can update line items for their invoices" ON public.invoice_line_items;
DROP POLICY IF EXISTS "Users can delete line items for their invoices" ON public.invoice_line_items;

-- Drop the function since we won't need it anymore
DROP FUNCTION IF EXISTS public.user_owns_invoice_for_line_item(uuid);
