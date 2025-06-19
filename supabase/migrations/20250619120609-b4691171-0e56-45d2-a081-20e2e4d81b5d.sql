
-- Add internal_notes column to orders table
ALTER TABLE public.orders 
ADD COLUMN internal_notes TEXT;
