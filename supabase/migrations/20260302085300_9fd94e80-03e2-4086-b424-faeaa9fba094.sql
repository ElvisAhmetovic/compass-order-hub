
-- Create monthly_contracts table
CREATE TABLE public.monthly_contracts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name text NOT NULL,
  client_email text NOT NULL,
  website text,
  total_value numeric NOT NULL,
  monthly_amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'EUR',
  start_date date NOT NULL,
  duration_months integer NOT NULL DEFAULT 12,
  status text NOT NULL DEFAULT 'active',
  description text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create monthly_installments table
CREATE TABLE public.monthly_installments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id uuid NOT NULL REFERENCES public.monthly_contracts(id) ON DELETE CASCADE,
  month_label text NOT NULL,
  month_number integer NOT NULL,
  due_date date NOT NULL,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'EUR',
  payment_status text NOT NULL DEFAULT 'unpaid',
  paid_at timestamptz,
  email_sent boolean NOT NULL DEFAULT false,
  email_sent_at timestamptz,
  client_name text,
  client_email text,
  website text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.monthly_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_installments ENABLE ROW LEVEL SECURITY;

-- RLS for monthly_contracts
CREATE POLICY "Authenticated users can view monthly contracts"
  ON public.monthly_contracts FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins and agents can create monthly contracts"
  ON public.monthly_contracts FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND NOT is_client());

CREATE POLICY "Admins and agents can update monthly contracts"
  ON public.monthly_contracts FOR UPDATE
  USING (auth.uid() IS NOT NULL AND NOT is_client());

CREATE POLICY "Admins can delete monthly contracts"
  ON public.monthly_contracts FOR DELETE
  USING (is_admin());

-- RLS for monthly_installments
CREATE POLICY "Authenticated users can view monthly installments"
  ON public.monthly_installments FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins and agents can create monthly installments"
  ON public.monthly_installments FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND NOT is_client());

CREATE POLICY "Admins and agents can update monthly installments"
  ON public.monthly_installments FOR UPDATE
  USING (auth.uid() IS NOT NULL AND NOT is_client());

CREATE POLICY "Admins can delete monthly installments"
  ON public.monthly_installments FOR DELETE
  USING (is_admin());

-- Service role insert policy for cron edge function
CREATE POLICY "Service role can manage monthly installments"
  ON public.monthly_installments FOR ALL
  USING (true)
  WITH CHECK (true);

-- Updated_at triggers
CREATE TRIGGER update_monthly_contracts_updated_at
  BEFORE UPDATE ON public.monthly_contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_monthly_installments_updated_at
  BEFORE UPDATE ON public.monthly_installments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Index for faster lookups
CREATE INDEX idx_monthly_installments_contract_id ON public.monthly_installments(contract_id);
CREATE INDEX idx_monthly_installments_payment_status ON public.monthly_installments(payment_status);
CREATE INDEX idx_monthly_contracts_status ON public.monthly_contracts(status);
