-- Add contact_name column to orders table (referenced in TypeScript types but missing from DB)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS contact_name text;