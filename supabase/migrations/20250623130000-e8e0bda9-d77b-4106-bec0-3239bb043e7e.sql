
-- Add dedicated columns for Facebook, Instagram, and Trustpilot statuses
ALTER TABLE public.orders 
ADD COLUMN status_facebook BOOLEAN DEFAULT FALSE,
ADD COLUMN status_instagram BOOLEAN DEFAULT FALSE,
ADD COLUMN status_trustpilot BOOLEAN DEFAULT FALSE;

-- Update the updated_at trigger to include the new columns
CREATE OR REPLACE FUNCTION public.update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
