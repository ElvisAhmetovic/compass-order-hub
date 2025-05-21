
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User, Session } from "@supabase/supabase-js";

// Define a clear interface for the login result to prevent excessive type depth
interface LoginResult {
  success: boolean;
  error?: string;
  user?: User | null;
  session?: Session | null;
}

export function useSupabaseLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Explicitly type the return value to avoid TypeScript recursion issues
  const signIn = async (email: string, password: string): Promise<LoginResult> => {
    try {
      setIsLoading(true);
      
      // Clean up email for consistency
      const cleanEmail = email.toLowerCase().trim();
      console.log(`Attempting login with email: ${cleanEmail}`);
      
      // First check if the user exists - this query was causing an error due to missing email column
      // Removed this check as it was causing a database error
      
      // Sign in with Supabase - ensure email and password are correctly passed
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email: cleanEmail, 
        password 
      });
      
      console.log("Login response data:", data);
      if (error) {
        console.error("Login error details:", error);
        
        // Special case for email verification
        if (error.message.includes("Email not confirmed")) {
          toast({
            title: "Email not verified",
            description: "Please check your inbox and verify your email before logging in.",
            variant: "destructive"
          });
          return { success: false, error: "Email not verified" };
        }
        
        toast({
          title: "Login failed",
          description: "Invalid login credentials. Please check your email and password.",
          variant: "destructive"
        });
        return { success: false, error: error.message };
      }
      
      if (!data.user || !data.session) {
        console.error("Login failed: No user or session returned");
        toast({
          title: "Login failed",
          description: "Something went wrong with authentication. Please try again.",
          variant: "destructive"
        });
        return { success: false, error: "Authentication failed" };
      }
      
      // Success handling
      console.log("Login successful, user:", data.user);
      
      // Check if the user is admin
      if (cleanEmail === "luciferbebistar@gmail.com" && data.user) {
        try {
          // Update app_users storage to ensure admin role
          const appUsers = JSON.parse(localStorage.getItem("app_users") || "[]");
          const adminIndex = appUsers.findIndex((u: any) => u.email === cleanEmail);
          
          if (adminIndex >= 0) {
            appUsers[adminIndex].role = "admin";
          } else {
            appUsers.push({
              id: data.user.id,
              email: cleanEmail,
              role: "admin",
              full_name: data.user.user_metadata?.full_name || "Admin User",
              created_at: new Date().toISOString()
            });
          }
          
          localStorage.setItem("app_users", JSON.stringify(appUsers));
          
          toast({
            title: "Admin login successful",
            description: "Welcome back, admin!",
          });
        } catch (storageError) {
          console.error("Error updating admin in localStorage", storageError);
        }
      } else {
        toast({
          title: "Login successful",
          description: "Welcome back!",
        });
      }
      
      return { 
        success: true, 
        user: data.user, 
        session: data.session 
      };
    } catch (error: any) {
      console.error("Unexpected login error:", error);
      toast({
        title: "Login error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
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
