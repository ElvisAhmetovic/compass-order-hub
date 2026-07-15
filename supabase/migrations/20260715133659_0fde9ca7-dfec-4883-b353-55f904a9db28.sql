ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS bill_to_name text,
  ADD COLUMN IF NOT EXISTS bill_to_email text,
  ADD COLUMN IF NOT EXISTS bill_to_address text,
  ADD COLUMN IF NOT EXISTS bill_to_city text,
  ADD COLUMN IF NOT EXISTS bill_to_zip_code text,
  ADD COLUMN IF NOT EXISTS bill_to_country text;