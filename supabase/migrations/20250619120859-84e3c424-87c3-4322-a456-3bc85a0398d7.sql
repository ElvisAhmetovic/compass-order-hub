
-- Add inventory_items column to orders table
ALTER TABLE public.orders 
ADD COLUMN inventory_items TEXT;
