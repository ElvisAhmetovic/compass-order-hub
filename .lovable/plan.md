

## Update Admin User Names in Database

### Problem
The user wants to rename two admin users in the system:
- "Kenan Huzbasic" → "Stefan Wolf"
- "Adis Berbic" → "Suzie Mckenna"

### Solution
Run a database migration to update the `first_name` and `last_name` fields in the `profiles` table, and also update the `full_name` and/or `email` display name in the `app_users` table if those records exist.

### Database Migration
```sql
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
```

### What This Covers
- Updates the `profiles` table (which drives the sidebar, header, and user management display)
- Updates the `app_users` table (which stores display names for email lookups)
- No code changes needed — the app reads names from these tables dynamically

