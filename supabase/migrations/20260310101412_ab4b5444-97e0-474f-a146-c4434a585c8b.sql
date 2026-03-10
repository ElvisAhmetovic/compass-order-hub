CREATE OR REPLACE FUNCTION public.generate_invoice_number(
  prefix_param text DEFAULT 'INV'::text,
  year_param integer DEFAULT NULL,
  sequence_param integer DEFAULT NULL
)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  target_year INTEGER;
  next_sequence INTEGER;
  invoice_number TEXT;
BEGIN
  target_year := COALESCE(year_param, EXTRACT(YEAR FROM NOW())::INTEGER);
  
  IF sequence_param IS NOT NULL THEN
    -- Manual sequence: upsert with the provided sequence number
    INSERT INTO public.invoice_sequences (year, prefix, last_sequence)
    VALUES (target_year, prefix_param, sequence_param)
    ON CONFLICT (year, prefix)
    DO UPDATE SET 
      last_sequence = GREATEST(invoice_sequences.last_sequence, sequence_param),
      updated_at = NOW()
    RETURNING last_sequence INTO next_sequence;
  ELSE
    -- Auto-increment as before
    INSERT INTO public.invoice_sequences (year, prefix, last_sequence)
    VALUES (target_year, prefix_param, 1)
    ON CONFLICT (year, prefix)
    DO UPDATE SET 
      last_sequence = invoice_sequences.last_sequence + 1,
      updated_at = NOW()
    RETURNING last_sequence INTO next_sequence;
  END IF;
  
  invoice_number := prefix_param || '-' || target_year || '-' || LPAD(next_sequence::TEXT, 3, '0');
  
  RETURN invoice_number;
END;
$function$;