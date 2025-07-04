/**
 * Authenticates a user with email/username and password
 * 
 * @param identifier Email or username
 * @param password User password
 * @returns Authentication result object
 */
export const authenticate = async (identifier: string, password: string) => {
  try {
    // Get users from local storage
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    // Check if identifier is username or email
    const isEmail = identifier.includes("@");
    
    // Find the user by username or email
    const user = users.find((user: any) => 
      isEmail ? user.email === identifier : user.username === identifier
    );
    
    // If user not found or password doesn't match
    if (!user || btoa(password) !== user.passwordHash) {
      return {
        success: false,
        error: "Invalid email/username or password"
      };
    }
    
    // Get the user role from app_users if available
    let userRole = "user";
    const appUsers = JSON.parse(localStorage.getItem("app_users") || "[]");
    const appUser = appUsers.find((u: any) => u.id === user.id || u.email === user.email);
    if (appUser && appUser.role) {
      userRole = appUser.role;
    }
    
    // Set user session
    localStorage.setItem("userSession", JSON.stringify({
      id: user.id,
      email: user.email,
      role: userRole,
      full_name: user.fullName
    }));
    
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: userRole,
        full_name: user.fullName
      }
    };
  } catch (error) {
    console.error("Authentication error:", error);
    return {
      success: false,
      error: "An unexpected error occurred."
    };
  }
};

/**
 * Logs out the current user
 */
export const logout = () => {
  localStorage.removeItem("userSession");
};

/**
 * Gets the current authenticated user
 * 
 * @returns Current user or null if not authenticated
 */
export const getCurrentUser = () => {
  const userSession = localStorage.getItem("userSession");
  return userSession ? JSON.parse(userSession) : null;
};

/**
 * Checks if the user is authenticated
 * 
 * @returns Boolean indicating if user is authenticated
 */
export const isAuthenticated = () => {
  return !!getCurrentUser();
};
