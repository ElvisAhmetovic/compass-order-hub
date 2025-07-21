
-- Add the missing status columns for Trustpilot Deletion and Google Deletion
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS status_trustpilot_deletion BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS status_google_deletion BOOLEAN DEFAULT FALSE;

-- Update the updated_at timestamp for any affected rows
UPDATE public.orders 
SET updated_at = NOW() 
WHERE status_trustpilot_deletion IS NULL OR status_google_deletion IS NULL;
