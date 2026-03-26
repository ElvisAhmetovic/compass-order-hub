CREATE OR REPLACE FUNCTION public.sync_invoice_status_by_order(
  p_order_id uuid,
  p_status text,
  p_next_reminder_at timestamptz DEFAULT NULL
)
RETURNS TABLE(synced_invoice_id uuid, synced_invoice_number text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_status NOT IN ('draft', 'sent', 'paid', 'overdue', 'cancelled', 'refunded', 'partially_paid') THEN
    RAISE EXCEPTION 'Invalid invoice status: %', p_status;
  END IF;

  RETURN QUERY
  UPDATE invoices
  SET status = p_status,
      next_reminder_at = p_next_reminder_at,
      updated_at = now()
  WHERE id = (
    SELECT id FROM invoices 
    WHERE order_id = p_order_id 
    LIMIT 1
  )
  RETURNING id AS synced_invoice_id, invoice_number AS synced_invoice_number;

  IF NOT FOUND THEN
    RETURN QUERY
    UPDATE invoices
    SET status = p_status,
        next_reminder_at = p_next_reminder_at,
        updated_at = now()
    WHERE id = (
      SELECT id FROM invoices 
      WHERE notes ILIKE '%Order ID: ' || p_order_id::text || '%'
      LIMIT 1
    )
    RETURNING id AS synced_invoice_id, invoice_number AS synced_invoice_number;
  END IF;
END;
$$;