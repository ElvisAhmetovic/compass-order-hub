ALTER TABLE public.monthly_contracts
  ADD COLUMN IF NOT EXISTS stripe_checkout_created_at timestamptz,
  ADD COLUMN IF NOT EXISTS stripe_link_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS stripe_ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS renewal_notified_at timestamptz;
ALTER TABLE public.stripe_payments
  ADD COLUMN IF NOT EXISTS payment_method_label text,
  ADD COLUMN IF NOT EXISTS failure_reason text;