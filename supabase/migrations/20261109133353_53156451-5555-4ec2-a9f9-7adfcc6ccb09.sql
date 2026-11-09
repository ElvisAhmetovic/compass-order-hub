ALTER TABLE public.monthly_contracts
  ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'bank_transfer',
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS stripe_status text,
  ADD COLUMN IF NOT EXISTS stripe_checkout_url text,
  ADD COLUMN IF NOT EXISTS current_period_end timestamptz,
  ADD COLUMN IF NOT EXISTS cancel_at timestamptz;

CREATE TABLE public.stripe_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid REFERENCES public.monthly_contracts(id) ON DELETE SET NULL,
  installment_id uuid REFERENCES public.monthly_installments(id) ON DELETE SET NULL,
  client_email text,
  stripe_invoice_id text UNIQUE,
  stripe_subscription_id text,
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'EUR',
  status text NOT NULL,
  hosted_invoice_url text,
  invoice_pdf_url text,
  period_start timestamptz,
  period_end timestamptz,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.stripe_payments TO authenticated;
GRANT ALL ON public.stripe_payments TO service_role;
ALTER TABLE public.stripe_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team can view stripe payments" ON public.stripe_payments
  FOR SELECT TO authenticated USING (NOT public.is_client());
CREATE TRIGGER stripe_payments_updated_at BEFORE UPDATE ON public.stripe_payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX stripe_payments_contract_idx ON public.stripe_payments(contract_id);

CREATE TABLE public.stripe_events (
  id text PRIMARY KEY,
  type text NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.stripe_events TO service_role;
ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;