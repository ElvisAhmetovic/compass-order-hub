
CREATE OR REPLACE FUNCTION public.update_invoice_status_on_payment()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  total_paid NUMERIC;
  invoice_total NUMERIC;
BEGIN
  SELECT COALESCE(SUM(amount), 0)
  INTO total_paid
  FROM public.payments
  WHERE invoice_id = NEW.invoice_id;
  
  SELECT total_amount
  INTO invoice_total
  FROM public.invoices
  WHERE id = NEW.invoice_id;
  
  UPDATE public.invoices
  SET 
    status = CASE 
      WHEN total_paid >= invoice_total THEN 'paid'
      WHEN total_paid > 0 AND total_paid < invoice_total THEN 'partially_paid'
      ELSE status
    END,
    next_reminder_at = CASE 
      WHEN total_paid >= invoice_total THEN NULL
      WHEN total_paid > 0 AND total_paid < invoice_total THEN NULL
      ELSE next_reminder_at
    END,
    updated_at = NOW()
  WHERE id = NEW.invoice_id;
  
  RETURN NEW;
END;
$function$;
