ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS service_date date, ADD COLUMN IF NOT EXISTS service_period_end date;

CREATE OR REPLACE FUNCTION public.update_invoice_with_lines(p_invoice_id uuid, p_header jsonb, p_lines jsonb)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_line jsonb;
  v_keep_ids uuid[] := ARRAY[]::uuid[];
  v_id uuid;
BEGIN
  UPDATE public.invoices SET
    client_id       = COALESCE((p_header->>'client_id')::uuid, client_id),
    issue_date      = COALESCE((p_header->>'issue_date')::date, issue_date),
    due_date        = COALESCE((p_header->>'due_date')::date, due_date),
    service_date    = CASE WHEN p_header ? 'service_date' THEN NULLIF(p_header->>'service_date','')::date ELSE service_date END,
    service_period_end = CASE WHEN p_header ? 'service_period_end' THEN NULLIF(p_header->>'service_period_end','')::date ELSE service_period_end END,
    currency        = COALESCE(p_header->>'currency', currency),
    payment_terms   = COALESCE(p_header->>'payment_terms', payment_terms),
    notes           = CASE WHEN p_header ? 'notes' THEN p_header->>'notes' ELSE notes END,
    internal_notes  = CASE WHEN p_header ? 'internal_notes' THEN p_header->>'internal_notes' ELSE internal_notes END,
    invoice_number  = COALESCE(p_header->>'invoice_number', invoice_number),
    bill_to_name    = CASE WHEN p_header ? 'bill_to_name' THEN NULLIF(p_header->>'bill_to_name','') ELSE bill_to_name END,
    bill_to_email   = CASE WHEN p_header ? 'bill_to_email' THEN NULLIF(p_header->>'bill_to_email','') ELSE bill_to_email END,
    bill_to_address = CASE WHEN p_header ? 'bill_to_address' THEN NULLIF(p_header->>'bill_to_address','') ELSE bill_to_address END,
    bill_to_city    = CASE WHEN p_header ? 'bill_to_city' THEN NULLIF(p_header->>'bill_to_city','') ELSE bill_to_city END,
    bill_to_zip_code = CASE WHEN p_header ? 'bill_to_zip_code' THEN NULLIF(p_header->>'bill_to_zip_code','') ELSE bill_to_zip_code END,
    bill_to_country = CASE WHEN p_header ? 'bill_to_country' THEN NULLIF(p_header->>'bill_to_country','') ELSE bill_to_country END,
    updated_at      = now()
  WHERE id = p_invoice_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invoice % not found', p_invoice_id;
  END IF;

  IF p_lines IS NOT NULL AND jsonb_typeof(p_lines) = 'array' THEN
    FOR v_line IN SELECT * FROM jsonb_array_elements(p_lines)
    LOOP
      IF (v_line ? 'id') AND NULLIF(v_line->>'id','') IS NOT NULL AND NOT (v_line->>'id' LIKE 'temp-%') THEN
        UPDATE public.invoice_line_items SET
          item_description = COALESCE(v_line->>'item_description', item_description),
          quantity         = COALESCE((v_line->>'quantity')::numeric, quantity),
          unit             = COALESCE(v_line->>'unit', unit),
          unit_price       = COALESCE((v_line->>'unit_price')::numeric, unit_price),
          vat_rate         = COALESCE((v_line->>'vat_rate')::numeric, vat_rate),
          discount_rate    = COALESCE((v_line->>'discount_rate')::numeric, discount_rate),
          updated_at       = now()
        WHERE id = (v_line->>'id')::uuid AND invoice_id = p_invoice_id
        RETURNING id INTO v_id;
        IF v_id IS NOT NULL THEN
          v_keep_ids := v_keep_ids || v_id;
        END IF;
      ELSE
        INSERT INTO public.invoice_line_items(
          invoice_id, item_description, quantity, unit, unit_price, vat_rate, discount_rate
        ) VALUES (
          p_invoice_id,
          COALESCE(v_line->>'item_description',''),
          COALESCE((v_line->>'quantity')::numeric, 1),
          COALESCE(v_line->>'unit','pcs'),
          COALESCE((v_line->>'unit_price')::numeric, 0),
          COALESCE((v_line->>'vat_rate')::numeric, 0),
          COALESCE((v_line->>'discount_rate')::numeric, 0)
        )
        RETURNING id INTO v_id;
        v_keep_ids := v_keep_ids || v_id;
      END IF;
    END LOOP;
  END IF;

  DELETE FROM public.invoice_line_items
  WHERE invoice_id = p_invoice_id
    AND NOT (id = ANY(v_keep_ids));

  PERFORM public.recalculate_invoice_totals(p_invoice_id);
END;
$function$;