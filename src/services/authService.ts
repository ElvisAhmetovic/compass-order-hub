
import { supabase } from "@/integrations/supabase/client";
import { LoginResult, SignUpResult } from "@/types/auth";
import { toast } from "@/hooks/use-toast";
import { UserRole } from "@/types";

/**
 * Handles the sign-in process with email and password
 */
export async function signInWithEmailAndPassword(
  email: string, 
  password: string
): Promise<LoginResult> {
  console.log("Sign in attempt with:", { email });
  
  try {
    // Handle special admin login case properly
    if (email === "luciferbebistar@gmail.com" && password === "Admin@123") {
      console.log("Admin login attempt detected");
      
      // Create a session in localStorage (this mimics what would happen with a real Supabase auth)
      const adminUser = {
        id: "admin-user-id",
        email: email,
        role: "admin",
        full_name: "Admin User"
      };
      
      console.log("Setting admin user in localStorage");
      localStorage.setItem("userSession", JSON.stringify(adminUser));
      
      toast({
        title: "Admin Login",
        description: "Welcome back, Administrator!",
      });
      
      return { success: true };
    }
    
    // Normal Supabase authentication for non-admin users
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      console.error("Sign in error:", error.message);
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error.message || "Invalid email or password"
      });
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    console.error("Unexpected sign in error:", error);
    toast({
      variant: "destructive",
      title: "Login Error",
      description: "An unexpected error occurred during login"
    });
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Handles user registration with email, password and profile data
 */
export async function signUpWithEmailAndPassword(
  email: string, 
  password: string, 
  fullName: string
): Promise<SignUpResult> {
  console.log("Sign up attempt with:", { email, fullName });
  
  try {    
    // Store full_name in user_metadata
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: {
          full_name: fullName,
          name: fullName,
          role: 'user' // Explicitly set default role
        }
      }
    });
    
    console.log("Sign up result:", error ? "Error" : "Success", data);
    
    if (error) {
      console.error("Sign up error:", error.message);
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: error.message
      });
      return { success: false, error: error.message };
    }
    
    toast({
      title: "Account Created",
      description: data.user ? "Your account has been created successfully! Please check your email for confirmation." : "Account created! Check your email for confirmation.",
    });
    
    // Important note for development
    console.log("Note: For development, you may want to disable email confirmation in Supabase console settings");
    
    return { success: true };
  } catch (error) {
    console.error("Unexpected sign up error:", error);
    toast({
      variant: "destructive",
      title: "Registration Error",
      description: "An unexpected error occurred during registration"
    });
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Signs out the current user
 */
export async function signOutUser(): Promise<void> {
  // Check if we have a special admin session
  const userSession = localStorage.getItem("userSession");
  if (userSession) {
    try {
      const parsedSession = JSON.parse(userSession);
      if (parsedSession.email === "luciferbebistar@gmail.com") {
        console.log("Admin logout: clearing localStorage session");
        localStorage.removeItem("userSession");
        return;
      }
    } catch (e) {
      console.error("Error parsing user session:", e);
    }
  }
  
  // For regular Supabase users, call the API to log out
  console.log("Regular user logout: calling Supabase signOut");
  await supabase.auth.signOut();
}
