CREATE OR REPLACE FUNCTION public.generate_invoice_number(prefix_param text DEFAULT 'INV'::text, year_param integer DEFAULT NULL::integer, sequence_param integer DEFAULT NULL::integer)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  target_year INTEGER;
  next_sequence INTEGER;
  highest_existing_sequence INTEGER;
  v_invoice_number TEXT;
BEGIN
  target_year := COALESCE(year_param, EXTRACT(YEAR FROM NOW())::INTEGER);

  SELECT COALESCE(MAX((regexp_match(i.invoice_number, '^' || regexp_replace(prefix_param, '([\\.\\+\\*\\?\\[\\^\\]\\$\\(\\)\\{\\}\\=\\!\\<\\>\\|\\:\\-])', '\\\\\1', 'g') || '-' || target_year || '-([0-9]+)$'))[1]::INTEGER), 0)
  INTO highest_existing_sequence
  FROM public.invoices i
  WHERE i.invoice_number ~ ('^' || regexp_replace(prefix_param, '([\\.\\+\\*\\?\\[\\^\\]\\$\\(\\)\\{\\}\\=\\!\\<\\>\\|\\:\\-])', '\\\\\1', 'g') || '-' || target_year || '-[0-9]+$');

  IF sequence_param IS NOT NULL THEN
    next_sequence := sequence_param;

    INSERT INTO public.invoice_sequences (year, prefix, last_sequence)
    VALUES (target_year, prefix_param, next_sequence)
    ON CONFLICT (year, prefix)
    DO UPDATE SET
      last_sequence = GREATEST(invoice_sequences.last_sequence, next_sequence),
      updated_at = NOW();

    v_invoice_number := prefix_param || '-' || target_year || '-' || CASE
      WHEN next_sequence < 1000 THEN LPAD(next_sequence::TEXT, 3, '0')
      ELSE next_sequence::TEXT
    END;

    RETURN v_invoice_number;
  END IF;

  LOOP
    INSERT INTO public.invoice_sequences (year, prefix, last_sequence)
    VALUES (target_year, prefix_param, GREATEST(highest_existing_sequence + 1, 1))
    ON CONFLICT (year, prefix)
    DO UPDATE SET
      last_sequence = GREATEST(invoice_sequences.last_sequence + 1, highest_existing_sequence + 1),
      updated_at = NOW()
    RETURNING last_sequence INTO next_sequence;

    v_invoice_number := prefix_param || '-' || target_year || '-' || CASE
      WHEN next_sequence < 1000 THEN LPAD(next_sequence::TEXT, 3, '0')
      ELSE next_sequence::TEXT
    END;

    EXIT WHEN NOT EXISTS (
      SELECT 1
      FROM public.invoices i
      WHERE i.invoice_number = v_invoice_number
    );
  END LOOP;

  RETURN v_invoice_number;
END;
$function$;