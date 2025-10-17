-- Update user ajosesales36@gmail.com (ID: bce307b6-aaa9-401a-9f5c-387e881b65a8) to admin role

-- Update the profiles table to set admin role
UPDATE profiles 
SET role = 'admin', updated_at = now()
WHERE id = 'bce307b6-aaa9-401a-9f5c-387e881b65a8';

-- Update the user_permissions table to set admin role
UPDATE user_permissions 
SET role = 'admin', updated_at = now()
WHERE id = 'bce307b6-aaa9-401a-9f5c-387e881b65a8';