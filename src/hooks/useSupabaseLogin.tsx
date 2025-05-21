
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
        
        // Try to login with provided credentials
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password
        });
        
        if (!error) {
          console.log("Admin login successful");
          
          // Update app_users storage to ensure admin role
          try {
            const appUsers = JSON.parse(localStorage.getItem("app_users") || "[]");
            const adminIndex = appUsers.findIndex((u: any) => u.email === cleanEmail);
            
            if (adminIndex >= 0) {
              appUsers[adminIndex].role = "admin";
            } else if (data.user) {
              appUsers.push({
                id: data.user.id,
                email: cleanEmail,
                role: "admin",
                full_name: data.user.user_metadata?.full_name || "Admin User",
                created_at: new Date().toISOString()
              });
            }
            
            localStorage.setItem("app_users", JSON.stringify(appUsers));
          } catch (error) {
            console.error("Error updating admin in localStorage", error);
          }
          
          return { success: true };
        }
        
        // If login failed with error, return the error
        console.error("Admin login failed:", error);
        return { success: false, error: error.message };
      } else {
        // Regular user login
        const { data, error } = await supabase.auth.signInWithPassword({ 
          email: cleanEmail, 
          password 
        });
        
        if (error) {
          console.error("Login error:", error);
          return { success: false, error: error.message };
        }
        
        toast({
          title: "Login successful",
          description: "Welcome back!",
        });
        
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
