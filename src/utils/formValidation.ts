/**
 * Validates an email address
 * @param email The email to validate
 * @returns Error message if invalid, undefined if valid
 */
export const validateEmail = (email: string): string | undefined => {
  if (!email.trim()) {
    return "Email is required";
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return "Please enter a valid email address";
  }
  
  return undefined;
};

/**
 * Validates a password with stronger requirements to match Supabase
 * @param password The password to validate
 * @returns Error message if invalid, undefined if valid
 */
export const validatePassword = (password: string): string | undefined => {
  if (!password.trim()) {
    return "Password is required";
  }
  
  if (password.length < 8) {
    return "Password must be at least 8 characters";
  }
  
  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return "Password must contain at least one uppercase letter";
  }
  
  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    return "Password must contain at least one lowercase letter";
  }
  
  // Check for at least one number
  if (!/\d/.test(password)) {
    return "Password must contain at least one number";
  }
  
  // Check for at least one special character
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return "Password must contain at least one special character (!@#$%^&*(),.?\":{}|<>)";
  }
  
  // Check against common weak passwords
  const commonPasswords = [
    'password', 'password123', '123456', '123456789', 'qwerty', 
    'abc123', 'password1', 'admin', 'letmein', 'welcome'
  ];
  
  if (commonPasswords.includes(password.toLowerCase())) {
    return "This password is too common. Please choose a more unique password";
  }
  
  return undefined;
};

/**
 * Validates a full name
 * @param name The name to validate
 * @returns Error message if invalid, undefined if valid
 */
export const validateFullName = (name: string): string | undefined => {
  if (!name.trim()) {
    return "Full name is required";
  }
  
  if (name.trim().length < 2) {
    return "Full name must be at least 2 characters";
  }
  
  return undefined;
};

/**
 * Validates username (alphanumeric, underscore, hyphen allowed)
 * @param username The username to validate
 * @returns Error message if invalid, undefined if valid
 */
export const validateUsername = (username: string): string | undefined => {
  if (!username.trim()) {
    return "Username is required";
  }
  
  if (username.length < 3) {
    return "Username must be at least 3 characters";
  }
  
  if (username.length > 20) {
    return "Username must be no more than 20 characters";
  }
  
  const usernameRegex = /^[a-zA-Z0-9_-]+$/;
  if (!usernameRegex.test(username)) {
    return "Username can only contain letters, numbers, underscores, and hyphens";
  }
  
  return undefined;
};

/**
 * Legacy function for backwards compatibility - now just validates email
 * @param identifier The identifier to validate (treated as email)
 * @returns Error message if invalid, undefined if valid
 */
export const validateIdentifier = (identifier: string): string | undefined => {
  return validateEmail(identifier);
};
