-- Update user georgabmediateam@gmail.com (Amir Sumez) to admin role

-- Update the profiles table to set admin role
UPDATE profiles 
SET role = 'admin', updated_at = now()
WHERE id = '4418ac26-32b0-41da-958a-f6393989d597';

-- Update the user_permissions table to set admin role
UPDATE user_permissions 
SET role = 'admin', updated_at = now()
WHERE id = '4418ac26-32b0-41da-958a-f6393989d597';