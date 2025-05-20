
// Fake user database for demonstration - in a real app, this would be in your backend
const fakeUsers = [
  { email: "user@example.com", username: "user1", password: "Password123" },
  { email: "admin@example.com", username: "admin", password: "Admin123!" }
];

interface AuthResult {
  success: boolean;
  error?: string;
  user?: typeof fakeUsers[0];
}

export const authenticate = async (identifier: string, password: string): Promise<AuthResult> => {
  // First check if the user exists (by email or username)
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
  
  // User exists, now check if password is correct
  if (user.password !== password) {
    return { 
      success: false, 
      error: "Incorrect password" 
    };
  }
  
  // Successful login - both username/email and password match
  return {
    success: true,
    user
  };
};
