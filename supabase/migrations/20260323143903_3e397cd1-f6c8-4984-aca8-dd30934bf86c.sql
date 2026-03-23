-- Update Kenan Huzbasic → Stefan Wolf
UPDATE public.profiles 
SET first_name = 'Stefan', last_name = 'Wolf', updated_at = now()
WHERE first_name = 'Kenan' AND last_name = 'Huzbasic';

UPDATE public.app_users 
SET full_name = 'Stefan Wolf'
WHERE full_name ILIKE '%Kenan%Huzbasic%' OR full_name ILIKE '%Kenan Huzbasic%';

-- Update Adis Berbic → Suzie Mckenna
UPDATE public.profiles 
SET first_name = 'Suzie', last_name = 'Mckenna', updated_at = now()
WHERE first_name = 'Adis' AND last_name = 'Berbic';

UPDATE public.app_users 
SET full_name = 'Suzie Mckenna'
WHERE full_name ILIKE '%Adis%Berbic%' OR full_name ILIKE '%Adis Berbic%';