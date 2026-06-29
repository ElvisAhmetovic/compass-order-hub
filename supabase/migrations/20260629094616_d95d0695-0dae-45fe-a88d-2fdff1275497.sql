
CREATE TABLE public.invoice_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  actor_user_id uuid,
  actor_email text,
  actor_name text,
  actor_role text,
  order_id uuid,
  order_company_name text,
  order_contact_email text,
  order_price numeric,
  order_currency text,
  client_id uuid,
  client_name text,
  invoice_id uuid,
  invoice_number text,
  outcome text NOT NULL,
  error_code text,
  error_message text,
  attempt_number integer NOT NULL DEFAULT 1,
  source text,
  metadata jsonb
);

GRANT SELECT, INSERT ON public.invoice_audit_logs TO authenticated;
GRANT ALL ON public.invoice_audit_logs TO service_role;

ALTER TABLE public.invoice_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can read invoice audit logs"
  ON public.invoice_audit_logs
  FOR SELECT
  TO authenticated
  USING (public.wh_is_super_admin());

CREATE POLICY "Authenticated users can insert their own audit rows"
  ON public.invoice_audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (actor_user_id = auth.uid() OR actor_user_id IS NULL);

CREATE INDEX idx_invoice_audit_logs_created_at ON public.invoice_audit_logs (created_at DESC);
CREATE INDEX idx_invoice_audit_logs_order_id ON public.invoice_audit_logs (order_id);
CREATE INDEX idx_invoice_audit_logs_actor ON public.invoice_audit_logs (actor_user_id);
CREATE INDEX idx_invoice_audit_logs_outcome ON public.invoice_audit_logs (outcome);
