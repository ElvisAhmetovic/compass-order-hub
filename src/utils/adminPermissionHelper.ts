
import { v4 as uuidv4 } from 'uuid';
import { User, UserRole } from '@/types';

// Function to generate a random password
const generatePassword = () => {
  const length = 12;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
  let password = "";
  for (let i = 0, n = charset.length; i < length; ++i) {
    password += charset.charAt(Math.floor(Math.random() * n));
  }
  return password;
};

// Function to create a new user object
export const createNewUser = (userObj: any) => {
  const password = generatePassword();
  const passwordHash = btoa(password); // Simple encoding, not for production

  // Generate a proper UUID for the user ID
  const userId = crypto.randomUUID();
  console.log('🆔 Generated UUID for new admin user:', userId);

  // Create user object
  const newUser: User = {
    id: userId,
    email: userObj.email,
    role: userObj.role,
    full_name: userObj.full_name || userObj.email.split('@')[0],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  // Save user to local storage
  let users = JSON.parse(localStorage.getItem("users") || "[]");
  users.push({ ...newUser, passwordHash });
  localStorage.setItem("users", JSON.stringify(users));

  // Save user to app_users as well
  let appUsers = JSON.parse(localStorage.getItem("app_users") || "[]");
    appUsers.push({
      id: newUser.id,
      email: newUser.email,
      full_name: newUser.full_name,
      role: newUser.role,
      created_at: newUser.created_at,
      updated_at: newUser.updated_at
    });
  localStorage.setItem("app_users", JSON.stringify(appUsers));

  console.log('✅ Admin user created with UUID:', userId);

  return { ...newUser, password };
};
