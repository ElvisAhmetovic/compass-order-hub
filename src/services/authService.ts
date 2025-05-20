
// Fake user database for demonstration - in a real app, this would be in your backend
const fakeUsers = [
  { email: "user@example.com", username: "user1", password: "Password123" },
  { email: "admin@example.com", username: "admin", password: "Admin123!" }
];

export interface AuthResult {
  success: boolean;
  error?: "This username or email doesn't exist" | "Incorrect password";
  user?: typeof fakeUsers[0];
  userId?: string;
}

/**
 * Authenticate by username *or* email.
 * 1. Look up the user.
 * 2. If not found → "username/email doesn't exist".
 * 3. If found but password mismatch → "Incorrect password".
 * 4. If match → success.
 */
export const authenticate = async (identifier: string, password: string): Promise<AuthResult> => {
  // Step 1 – find the user
  const isEmail = identifier.includes('@');
  const user = fakeUsers.find(user => 
    isEmail ? user.email === identifier : user.username === identifier
  );
  
  // If no user found, return early with the appropriate message
  if (!user) {
    return { 
      success: false, 
      error: "This username or email doesn't exist" 
    };
  }
  
  // Step 2 – validate password (user exists, now check password)
  if (user.password !== password) {
    return { 
      success: false, 
      error: "Incorrect password" 
    };
  }
  
  // Step 3 – success
  return {
    success: true,
    user
  };
};
