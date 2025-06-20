
-- Enable RLS on invoice_line_items table
ALTER TABLE public.invoice_line_items ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view line items for their invoices
CREATE POLICY "Users can view line items for their invoices" 
  ON public.invoice_line_items 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.invoices 
      WHERE invoices.id = invoice_line_items.invoice_id 
      AND invoices.user_id = auth.uid()
    )
  );

-- Create policy to allow users to insert line items for their invoices
CREATE POLICY "Users can insert line items for their invoices" 
  ON public.invoice_line_items 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.invoices 
      WHERE invoices.id = invoice_line_items.invoice_id 
      AND invoices.user_id = auth.uid()
    )
  );

-- Create policy to allow users to update line items for their invoices
CREATE POLICY "Users can update line items for their invoices" 
  ON public.invoice_line_items 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.invoices 
      WHERE invoices.id = invoice_line_items.invoice_id 
      AND invoices.user_id = auth.uid()
    )
  );

-- Create policy to allow users to delete line items for their invoices
CREATE POLICY "Users can delete line items for their invoices" 
  ON public.invoice_line_items 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.invoices 
      WHERE invoices.id = invoice_line_items.invoice_id 
      AND invoices.user_id = auth.uid()
    )
  );
