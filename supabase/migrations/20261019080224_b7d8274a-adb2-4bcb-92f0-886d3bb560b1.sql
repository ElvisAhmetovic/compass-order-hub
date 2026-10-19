DELETE FROM public.monthly_installments WHERE id = '82716599-579d-466e-9664-44f8f1494f61' AND invoice_id IS NULL AND email_sent = false;
ALTER TABLE public.monthly_installments ADD CONSTRAINT monthly_installments_contract_month_unique UNIQUE (contract_id, due_date);

CREATE TABLE public.monthly_billing_daily_locks (
  run_date date PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.monthly_billing_daily_locks TO service_role;
ALTER TABLE public.monthly_billing_daily_locks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view billing locks" ON public.monthly_billing_daily_locks FOR SELECT TO authenticated USING (public.is_admin());
GRANT SELECT ON public.monthly_billing_daily_locks TO authenticated;