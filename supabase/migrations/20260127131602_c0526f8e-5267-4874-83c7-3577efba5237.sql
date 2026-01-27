-- Add client_visible_update column to orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS client_visible_update TEXT DEFAULT NULL;

COMMENT ON COLUMN public.orders.client_visible_update 
IS 'High-level status update visible to clients. Admin-editable only.';

-- Recreate client_orders view with the new column (privacy filter)
DROP VIEW IF EXISTS public.client_orders;

CREATE VIEW public.client_orders WITH (security_invoker=on) AS
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
    o.client_id,
    o.client_visible_update,
    c.id AS company_id,
    c.client_user_id,
    c.name AS linked_company_name,
    c.email AS company_email
FROM orders o
LEFT JOIN companies c ON o.company_id = c.id
WHERE o.deleted_at IS NULL 
  AND (o.status_deleted = false OR o.status_deleted IS NULL);