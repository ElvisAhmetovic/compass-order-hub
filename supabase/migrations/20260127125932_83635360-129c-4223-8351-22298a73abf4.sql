-- Add order_id to support_inquiries for order-specific support tickets
ALTER TABLE public.support_inquiries
ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_support_inquiries_order_id ON public.support_inquiries(order_id);

-- Ensure clients can view their own inquiries (drop if exists to avoid conflict)
DROP POLICY IF EXISTS "Clients can view their own inquiries" ON public.support_inquiries;
CREATE POLICY "Clients can view their own inquiries"
  ON public.support_inquiries
  FOR SELECT
  USING (user_id = auth.uid());

-- Ensure clients can create inquiries
DROP POLICY IF EXISTS "Clients can create inquiries" ON public.support_inquiries;
CREATE POLICY "Clients can create inquiries"
  ON public.support_inquiries
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Allow clients to add replies to their own inquiries
DROP POLICY IF EXISTS "Clients can add replies to their inquiries" ON public.support_replies;
CREATE POLICY "Clients can add replies to their inquiries"
  ON public.support_replies
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.support_inquiries si
      WHERE si.id = support_replies.inquiry_id
        AND si.user_id = auth.uid()
    )
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'agent'::app_role)
  );

-- Allow clients to view replies to their inquiries
DROP POLICY IF EXISTS "Clients can view replies to their inquiries" ON public.support_replies;
CREATE POLICY "Clients can view replies to their inquiries"
  ON public.support_replies
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.support_inquiries si
      WHERE si.id = support_replies.inquiry_id
        AND si.user_id = auth.uid()
    )
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'agent'::app_role)
  );