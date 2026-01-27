-- Phase 1: Database Foundation for Client Portal

-- Add client_user_id to companies table to link companies to client portal users
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS client_user_id UUID REFERENCES auth.users(id);

-- Create index for efficient client lookups
CREATE INDEX IF NOT EXISTS idx_companies_client_user_id ON public.companies(client_user_id);

-- Create a security definer function to check if user is a client with access to a specific company
CREATE OR REPLACE FUNCTION public.is_client_of_company(company_id_param uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.companies c
    JOIN public.profiles p ON p.id = auth.uid()
    WHERE c.id = company_id_param 
      AND c.client_user_id = auth.uid()
      AND p.role = 'client'
  );
$$;

-- Create a view for client-accessible order data (hides internal notes, agent info, assigned_to)
CREATE OR REPLACE VIEW public.client_orders WITH (security_invoker = true) AS
SELECT 
  o.id,
  o.company_name,
  o.description,
  o.status,
  o.created_at,
  o.updated_at,
  o.price,
  o.currency,
  o.priority,
  o.status_created,
  o.status_in_progress,
  o.status_invoice_sent,
  o.status_invoice_paid,
  o.status_resolved,
  o.status_cancelled,
  o.contact_email,
  o.contact_phone,
  c.id as company_id,
  c.client_user_id,
  c.name as linked_company_name,
  c.email as company_email
FROM public.orders o
LEFT JOIN public.companies c ON o.company_id = c.id
WHERE o.deleted_at IS NULL 
  AND (o.status_deleted = false OR o.status_deleted IS NULL);