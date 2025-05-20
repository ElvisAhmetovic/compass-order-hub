
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

export const authenticate = (identifier: string, password: string): AuthResult => {
  const isEmail = identifier.includes('@');
  const user = fakeUsers.find(user => 
    isEmail ? user.email === identifier : user.username === identifier
  );
  
  if (!user) {
    // User not found
    return { 
      success: false, 
      error: "No account found with this email/username" 
    };
  }
  
  if (user.password !== password) {
    // Incorrect password for existing user
    return { 
      success: false, 
      error: "Wrong password" 
    };
  }
  
  // Successful login
  return {
    success: true,
    user
  };
};
