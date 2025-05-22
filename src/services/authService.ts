
import { supabase } from "@/integrations/supabase/client";
import { LoginResult, SignUpResult } from "@/types/auth";

/**
 * Sign in with email and password
 */
export async function signInWithEmailAndPassword(email: string, password: string): Promise<LoginResult> {
  console.log("authService: Calling supabase.auth.signInWithPassword with:", {
    emailProvided: !!email,
    passwordProvided: !!password
  });

  try {
    // Special admin login case
    if (email === "luciferbebistar@gmail.com" && password === "Admin@123") {
      console.log("authService: Admin login detected, using special flow");
      
      // Create a mock admin user in localStorage
      const adminUser = {
        id: "admin-user-id",
        email: "luciferbebistar@gmail.com",
        role: "admin",
        full_name: "Admin User",
        app_metadata: {},
        user_metadata: {
          role: "admin",
          full_name: "Admin User"
        },
        aud: "authenticated",
        created_at: new Date().toISOString()
      };
      
      // Store in localStorage for the session
      localStorage.setItem("admin-user", JSON.stringify(adminUser));
      
      return {
        success: true
      };
    }
    
    // Regular login flow using Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    console.log("authService: signInWithPassword result:", { 
      success: !error, 
      hasUser: !!data?.user,
      hasSession: !!data?.session,
      errorMessage: error?.message
    });

    if (error) {
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: true
    };
  } catch (err) {
    console.error("authService: Unexpected error during signIn:", err);
    return {
      success: false,
      error: "An unexpected authentication error occurred"
    };
  }
}

/**
 * Sign up with email, password and name
 */
export async function signUpWithEmailAndPassword(
  email: string,
  password: string,
  fullName: string
): Promise<SignUpResult> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    });

    if (error) {
      return {
        success: false,
        error: error.message
      };
    }

    // Check if email confirmation is required
    if (data.user && !data.session) {
      return {
        success: true,
        needsEmailConfirmation: true
      };
    }

    return {
      success: true
    };
  } catch (err) {
    console.error("Unexpected error during signUp:", err);
    return {
      success: false,
      error: "An unexpected error occurred during registration"
    };
  }
}

/**
 * Sign out current user
 */
export async function signOutUser(): Promise<void> {
  // Check for admin user in localStorage first
  if (localStorage.getItem("admin-user")) {
    console.log("Signing out admin user");
    localStorage.removeItem("admin-user");
    return;
  }
  
  // Regular Supabase signout
  await supabase.auth.signOut();
}
