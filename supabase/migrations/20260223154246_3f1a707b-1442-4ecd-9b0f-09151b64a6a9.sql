-- Add assignment columns to customer_tickets
ALTER TABLE public.customer_tickets 
  ADD COLUMN assigned_client_id uuid,
  ADD COLUMN assigned_client_name text,
  ADD COLUMN assigned_client_email text;