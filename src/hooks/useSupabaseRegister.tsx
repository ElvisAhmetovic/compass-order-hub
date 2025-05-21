
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useSupabaseRegister() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      setIsLoading(true);
      
      // Clean up email for consistency
      const cleanEmail = email.toLowerCase().trim();
      console.log(`Attempting to register with email: ${cleanEmail}`);
      
      // Create user metadata
      const userMetadata = { full_name: fullName };
      
      // Special handling for admin user
      if (cleanEmail === "luciferbebistar@gmail.com") {
        Object.assign(userMetadata, { role: "admin" });
        console.log("Creating admin account");
      }
      
      // Sign up the user
      const { data, error } = await supabase.auth.signUp({ 
        email: cleanEmail, 
        password,
        options: {
          data: userMetadata,
          emailRedirectTo: window.location.origin + '/auth'
        }
      });
      
      console.log("Registration response:", data, error);
      
      if (error) {
        console.error("Registration error:", error);
        toast({
          title: "Registration failed",
          description: error.message || "Failed to create account. Please try again.",
          variant: "destructive"
        });
        return { success: false, error: error.message };
      }
      
      if (!data.user) {
        console.error("Registration failed: No user returned");
        toast({
          title: "Registration failed",
          description: "Something went wrong. Please try again.",
          variant: "destructive"
        });
        return { success: false, error: "Registration failed" };
      }
      
      // Special handling for admin after signup
      if (cleanEmail === "luciferbebistar@gmail.com" && data.user) {
        try {
          // Update in app_users storage
          const appUsers = JSON.parse(localStorage.getItem("app_users") || "[]");
          
          // Check if admin already exists
          const adminExists = appUsers.some((u: any) => u.email === "luciferbebistar@gmail.com");
          
          // If admin doesn't exist, add them
          if (!adminExists) {
            appUsers.push({
              id: data.user.id,
              email: "luciferbebistar@gmail.com",
              role: "admin",
              full_name: fullName || "Admin User",
              created_at: new Date().toISOString()
            });
            
            localStorage.setItem("app_users", JSON.stringify(appUsers));
            console.log("Admin role updated in storage");
          }
        } catch (error) {
          console.error("Error updating admin in storage:", error);
        }
      }
      
      toast({
        title: "Account Created",
        description: "Your account has been created successfully! Check your email for verification.",
      });
      
      return { success: true };
    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        title: "Registration error",
        description: error?.message || "An unexpected error occurred during registration.",
        variant: "destructive"
      });
      return { success: false, error: "An unexpected error occurred" };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    signUp
  };
}
