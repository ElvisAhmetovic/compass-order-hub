
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
 * 1. Look up the user from localStorage first, then fallback to fake users.
 * 2. If not found → "username/email doesn't exist".
 * 3. If found but password mismatch → "Incorrect password".
 * 4. If match → success.
 */
export const authenticate = async (identifier: string, password: string): Promise<AuthResult> => {
  // Get users from localStorage
  const localUsers = JSON.parse(localStorage.getItem("users") || "[]");
  
  // Check localStorage first for registered users
  const isEmail = identifier.includes('@');
  const localUser = localUsers.find(
    (u: any) => isEmail ? u.email === identifier : u.username === identifier
  );
  
  // If found in localStorage
  if (localUser) {
    // Check password (using the simple btoa for demo)
    const matches = localUser.passwordHash === btoa(password);
    if (!matches) {
      return { 
        success: false, 
        error: "Incorrect password" 
      };
    }
    
    // Success - store a session token
    localStorage.setItem("userSession", JSON.stringify({ id: localUser.id }));
    return {
      success: true,
      userId: localUser.id
    };
  }
  
  // If not in localStorage, try the fake users (fallback)
  const fakeUser = fakeUsers.find(user => 
    isEmail ? user.email === identifier : user.username === identifier
  );
  
  // If no user found anywhere, return early with the appropriate message
  if (!fakeUser) {
    return { 
      success: false, 
      error: "This username or email doesn't exist" 
    };
  }
  
  // Fake user exists, validate password
  if (fakeUser.password !== password) {
    return { 
      success: false, 
      error: "Incorrect password" 
    };
  }
  
  // Success with fake user
  return {
    success: true,
    user: fakeUser
  };
};
