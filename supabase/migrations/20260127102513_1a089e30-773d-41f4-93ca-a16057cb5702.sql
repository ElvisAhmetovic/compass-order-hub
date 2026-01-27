-- Add order_id column to file_attachments for order attachments
ALTER TABLE public.file_attachments
ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE;

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_file_attachments_order_id ON public.file_attachments(order_id);

-- RLS Policy: Allow clients to view attachments for their orders
CREATE POLICY "Clients can view their order attachments"
  ON public.file_attachments
  FOR SELECT
  USING (
    -- Check if attachment belongs to an order the client owns
    (order_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = file_attachments.order_id
        AND (o.client_id = auth.uid() OR 
             EXISTS (
               SELECT 1 FROM public.companies c 
               WHERE c.id = o.company_id AND c.client_user_id = auth.uid()
             ))
    ))
    -- Internal users can view all attachments
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'agent')
    OR public.has_role(auth.uid(), 'user')
    -- Users can still view attachments they uploaded or existing non-order attachments
    OR auth.uid() = uploaded_by
  );