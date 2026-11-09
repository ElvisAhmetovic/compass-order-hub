ALTER TABLE public.monthly_contracts
  ADD COLUMN IF NOT EXISTS stripe_product_name text,
  ADD COLUMN IF NOT EXISTS stripe_product_description text;