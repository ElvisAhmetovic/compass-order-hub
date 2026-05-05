
CREATE TABLE public.monthly_cron_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  trigger TEXT NOT NULL DEFAULT 'cron',
  contracts_total INT NOT NULL DEFAULT 0,
  processed INT NOT NULL DEFAULT 0,
  invoices_created INT NOT NULL DEFAULT 0,
  client_emails_sent INT NOT NULL DEFAULT 0,
  team_emails_sent INT NOT NULL DEFAULT 0,
  errors_count INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'running',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.monthly_cron_contract_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  run_id UUID NOT NULL REFERENCES public.monthly_cron_runs(id) ON DELETE CASCADE,
  contract_id UUID,
  client_name TEXT,
  month_label TEXT,
  status TEXT NOT NULL,
  reason TEXT,
  invoice_id UUID,
  error_detail TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_monthly_cron_runs_started_at ON public.monthly_cron_runs(started_at DESC);
CREATE INDEX idx_monthly_cron_results_run_id ON public.monthly_cron_contract_results(run_id);

ALTER TABLE public.monthly_cron_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_cron_contract_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view cron runs"
  ON public.monthly_cron_runs FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can view cron results"
  ON public.monthly_cron_contract_results FOR SELECT
  USING (public.is_admin());
