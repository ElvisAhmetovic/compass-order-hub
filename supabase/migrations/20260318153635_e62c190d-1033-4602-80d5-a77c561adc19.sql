
-- Add order_id column to invoices table for direct linking
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL;

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON public.invoices(order_id);

-- Backfill order_id from notes field for existing invoices
UPDATE public.invoices
SET order_id = (
  regexp_match(notes, 'Order ID: ([a-f0-9\-]{36})')
)[1]::uuid
WHERE notes LIKE '%Order ID:%'
  AND order_id IS NULL;
