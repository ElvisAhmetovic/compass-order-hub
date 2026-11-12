ALTER TABLE public.stripe_payments
  ADD COLUMN IF NOT EXISTS payment_intent_id text,
  ADD COLUMN IF NOT EXISTS refunded_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS refunded_at timestamptz,
  ADD COLUMN IF NOT EXISTS dispute_status text;
CREATE INDEX IF NOT EXISTS stripe_payments_pi_idx ON public.stripe_payments(payment_intent_id);
ALTER TABLE public.monthly_contracts ADD COLUMN IF NOT EXISTS stripe_checkout_expired_at timestamptz;
ALTER TABLE public.order_payment_links ADD COLUMN IF NOT EXISTS expired_at timestamptz;