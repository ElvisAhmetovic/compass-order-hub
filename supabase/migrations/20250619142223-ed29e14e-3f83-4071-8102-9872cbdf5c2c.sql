
-- Add missing map_link column to companies table if it doesn't exist
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS map_link text;

-- Add missing user_id column to companies table if it doesn't exist  
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- Update existing companies to have a user_id if they don't have one
UPDATE public.companies 
SET user_id = (SELECT id FROM auth.users LIMIT 1)
WHERE user_id IS NULL;
