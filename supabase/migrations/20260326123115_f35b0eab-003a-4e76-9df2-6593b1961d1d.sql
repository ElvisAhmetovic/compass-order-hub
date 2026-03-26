CREATE OR REPLACE FUNCTION public.sync_invoice_status(
  p_invoice_id uuid,
  p_status text,
  p_next_reminder_at timestamptz DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_status NOT IN ('draft', 'sent', 'paid', 'overdue', 'cancelled', 'refunded', 'partially_paid') THEN
    RAISE EXCEPTION 'Invalid invoice status: %', p_status;
  END IF;

  UPDATE invoices
  SET status = p_status,
      next_reminder_at = p_next_reminder_at,
      updated_at = now()
  WHERE id = p_invoice_id;
END;
$$;