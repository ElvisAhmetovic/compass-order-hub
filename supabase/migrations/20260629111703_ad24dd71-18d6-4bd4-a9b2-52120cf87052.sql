-- Fix #3: Grant audit log writes for authenticated users (RLS policy already in place)
GRANT SELECT, INSERT ON public.invoice_audit_logs TO authenticated;
GRANT ALL ON public.invoice_audit_logs TO service_role;

-- Fix #1: Enforce one active invoice per order at the DB layer
CREATE UNIQUE INDEX IF NOT EXISTS uniq_invoices_order_id_active
  ON public.invoices(order_id)
  WHERE order_id IS NOT NULL AND status <> 'cancelled';