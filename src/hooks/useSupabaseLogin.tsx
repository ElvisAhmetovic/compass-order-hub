
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useSupabaseLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      // Clean up email for consistency
      const cleanEmail = email.toLowerCase().trim();
      
      // Special handling for admin user
      if (cleanEmail === "luciferbebistar@gmail.com") {
        console.log("Admin login attempt");
        
        // First attempt direct login
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password
        });
        
        if (!error) {
          console.log("Admin login successful");
          return { success: true };
        }
        
        // If login failed, check if we need to create the admin account
        console.log("Admin login failed, attempting to create account", error);
        
        // Try to create the admin account with the provided password
        const signUpResult = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              full_name: "Admin User",
              role: "admin"
            }
          }
        });
        
        if (signUpResult.error) {
          console.error("Admin account creation failed:", signUpResult.error);
          return { 
            success: false, 
            error: signUpResult.error.message || "Unable to create admin account"
          };
        }
        
        // Admin account created, now try to log in with the provided credentials
        console.log("Admin account created, attempting login");
        
        // Add a short delay to allow the account to be fully registered
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const loginResult = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password
        });
        
        if (loginResult.error) {
          console.error("Admin login after creation failed:", loginResult.error);
          return { 
            success: false, 
            error: "Admin account created but login failed. Please try again in a moment." 
          };
        }
        
        console.log("Admin login successful after account creation");
        return { success: true };
      } else {
        // Regular user login
        const { data, error } = await supabase.auth.signInWithPassword({ 
          email: cleanEmail, 
          password 
        });
        
        if (error) {
          return { success: false, error: error.message };
        }
        
        return { success: true };
      }
    } catch (error) {
      console.error("Unexpected login error:", error);
      return { success: false, error: "An unexpected error occurred" };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    signIn
  };
}
