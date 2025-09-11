-- Fix security issues identified by linter

-- Enable RLS on invoice_line_items table
ALTER TABLE public.invoice_line_items ENABLE ROW LEVEL SECURITY;

-- Fix function search_path for security
CREATE OR REPLACE FUNCTION public.update_orders_updated_at()
RETURNS trigger
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;