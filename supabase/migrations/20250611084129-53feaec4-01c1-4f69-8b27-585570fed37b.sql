
-- Add new boolean columns for each status type
ALTER TABLE public.orders 
ADD COLUMN status_created boolean DEFAULT true,
ADD COLUMN status_in_progress boolean DEFAULT false,
ADD COLUMN status_complaint boolean DEFAULT false,
ADD COLUMN status_invoice_sent boolean DEFAULT false,
ADD COLUMN status_invoice_paid boolean DEFAULT false,
ADD COLUMN status_resolved boolean DEFAULT false,
ADD COLUMN status_cancelled boolean DEFAULT false,
ADD COLUMN status_deleted boolean DEFAULT false,
ADD COLUMN status_review boolean DEFAULT false;

-- Update existing orders to set the appropriate status flag based on current status
UPDATE public.orders SET 
  status_created = CASE WHEN status = 'Created' THEN true ELSE false END,
  status_in_progress = CASE WHEN status = 'In Progress' THEN true ELSE false END,
  status_complaint = CASE WHEN status = 'Complaint' THEN true ELSE false END,
  status_invoice_sent = CASE WHEN status = 'Invoice Sent' THEN true ELSE false END,
  status_invoice_paid = CASE WHEN status = 'Invoice Paid' THEN true ELSE false END,
  status_resolved = CASE WHEN status = 'Resolved' THEN true ELSE false END,
  status_cancelled = CASE WHEN status = 'Cancelled' THEN true ELSE false END,
  status_deleted = CASE WHEN status = 'Deleted' THEN true ELSE false END,
  status_review = CASE WHEN status = 'Review' THEN true ELSE false END;

-- Keep the old status column for now for backward compatibility
-- We can remove it later after testing
