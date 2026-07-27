
-- 1) Atomic invoice update RPC
CREATE OR REPLACE FUNCTION public.update_invoice_with_lines(
  p_invoice_id uuid,
  p_header jsonb,
  p_lines jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_line jsonb;
  v_keep_ids uuid[] := ARRAY[]::uuid[];
  v_id uuid;
BEGIN
  -- Update header (only whitelisted fields)
  UPDATE public.invoices SET
    client_id       = COALESCE((p_header->>'client_id')::uuid, client_id),
    issue_date      = COALESCE((p_header->>'issue_date')::date, issue_date),
    due_date        = COALESCE((p_header->>'due_date')::date, due_date),
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

  -- Upsert lines
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

  -- Delete lines that were removed on the client
  DELETE FROM public.invoice_line_items
  WHERE invoice_id = p_invoice_id
    AND NOT (id = ANY(v_keep_ids));

  -- Recalculate totals from the current lines
  PERFORM public.recalculate_invoice_totals(p_invoice_id);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.update_invoice_with_lines(uuid, jsonb, jsonb) FROM anon;
GRANT EXECUTE ON FUNCTION public.update_invoice_with_lines(uuid, jsonb, jsonb) TO authenticated, service_role;

-- 2) Log review-request trigger failures instead of only warning
CREATE OR REPLACE FUNCTION public.trigger_review_request_on_order_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_url text := 'https://fjybmlugiqmiggsdrkiq.supabase.co/functions/v1/send-review-request';
BEGIN
  IF NEW.status_resolved IS TRUE
     AND NEW.status_invoice_paid IS TRUE
     AND NEW.review_request_sent_at IS NULL
     AND (
       OLD.status_resolved IS DISTINCT FROM NEW.status_resolved
       OR OLD.status_invoice_paid IS DISTINCT FROM NEW.status_invoice_paid
     )
  THEN
    BEGIN
      PERFORM net.http_post(
        url := v_url,
        body := jsonb_build_object('orderId', NEW.id::text),
        headers := '{"Content-Type":"application/json"}'::jsonb
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'send-review-request enqueue failed: %', SQLERRM;
      BEGIN
        INSERT INTO public.client_email_logs(
          order_id, sent_to, sent_by_name, company_name,
          order_price, currency, custom_message, template_name
        ) VALUES (
          NEW.id,
          COALESCE(NEW.contact_email, 'unknown'),
          'System',
          COALESCE(NEW.company_name, 'Unknown'),
          NEW.price,
          COALESCE(NEW.currency, 'EUR'),
          'review_request_error: ' || SQLERRM,
          'review_request_error'
        );
      EXCEPTION WHEN OTHERS THEN
        -- never block the order update
        NULL;
      END;
    END;
  END IF;
  RETURN NEW;
END;
$$;
