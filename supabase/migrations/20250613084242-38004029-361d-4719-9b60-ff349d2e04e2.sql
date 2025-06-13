
-- Add a column to track yearly packages
ALTER TABLE public.orders 
ADD COLUMN is_yearly_package boolean DEFAULT false;

-- Create an index for better performance when filtering yearly packages
CREATE INDEX idx_orders_yearly_package ON public.orders(is_yearly_package);

-- Add a comment for documentation
COMMENT ON COLUMN public.orders.is_yearly_package IS 'Indicates if this order is a yearly package that should be managed separately';
