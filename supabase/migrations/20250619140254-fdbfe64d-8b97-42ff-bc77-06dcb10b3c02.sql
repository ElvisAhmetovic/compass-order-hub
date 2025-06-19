
-- Add a deleted_at timestamp column to track when orders were soft deleted
ALTER TABLE public.orders 
ADD COLUMN deleted_at timestamp with time zone DEFAULT NULL;

-- Create an index for better performance when filtering deleted orders
CREATE INDEX idx_orders_deleted_at ON public.orders(deleted_at);

-- Update the existing status_deleted column to be consistent with soft deletes
-- Set deleted_at for orders that have status_deleted = true
UPDATE public.orders 
SET deleted_at = updated_at 
WHERE status_deleted = true AND deleted_at IS NULL;

-- Create a function to soft delete an order
CREATE OR REPLACE FUNCTION public.soft_delete_order(order_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.orders
  SET 
    status_deleted = true,
    deleted_at = now(),
    updated_at = now()
  WHERE id = order_id_param;
END;
$function$;

-- Create a function to restore a deleted order
CREATE OR REPLACE FUNCTION public.restore_order(order_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.orders
  SET 
    status_deleted = false,
    deleted_at = NULL,
    updated_at = now()
  WHERE id = order_id_param;
END;
$function$;
