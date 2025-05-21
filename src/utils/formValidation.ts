
import { containsProfanity, getProfanityError } from './profanityFilter';

export const validateIdentifier = (value: string) => {
  // Check if it's an email
  const isEmail = value.includes('@');
  
  if (isEmail) {
    // Email validation - simple regex for email format
    const emailRegex = /^[a-zA-Z0-9]+([._-]?[a-zA-Z0-9]+)*@[a-zA-Z0-9]+([.-]?[a-zA-Z0-9]+)*(\.[a-zA-Z]{2,})+$/;
    if (!emailRegex.test(value)) {
      return "Please enter a valid email address.";
    }
  } else {
    // Username validation - only letters and numbers
    const usernameRegex = /^[a-zA-Z0-9]+$/;
    if (!usernameRegex.test(value)) {
      return "Username can only contain letters and numbers.";
    }
  }
  
  // Check for profanity
  const profanityError = getProfanityError(value, isEmail ? 'Email' : 'Username');
  if (profanityError) {
    return profanityError;
  }
  
  return "";
};

export const validatePassword = (value: string) => {
  if (value.length < 8) {
    return "Password must be at least 8 characters.";
  }
  
  if (!/[A-Z]/.test(value)) {
    return "Password must include at least one uppercase letter.";
  }
  
  if (!/[a-z]/.test(value)) {
    return "Password must include at least one lowercase letter.";
  }
  
  if (!/[0-9]/.test(value)) {
    return "Password must include at least one number.";
  }
  
  // Common password check (very basic implementation)
  const commonPasswords = ["password", "12345678", "qwerty123"];
  if (commonPasswords.includes(value.toLowerCase())) {
    return "This password is too common. Please choose a stronger one.";
  }
  
  return "";
};

export const validateFullName = (value: string) => {
  if (value.trim().length < 2) {
    return "Full name must be at least 2 characters.";
  }
  
  const nameRegex = /^[a-zA-Z\s]+$/;
  if (!nameRegex.test(value)) {
    return "Full name can only contain letters and spaces.";
  }
  
  // Check for profanity in name
  const profanityError = getProfanityError(value, 'Full name');
  if (profanityError) {
    return profanityError;
  }
  
  return "";
};

