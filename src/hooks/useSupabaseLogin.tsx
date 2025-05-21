
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
      console.log(`Attempting login with email: ${cleanEmail}`);
      
      // Sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email: cleanEmail, 
        password 
      });
      
      console.log("Login response:", data, error);
      
      if (error) {
        console.error("Login error:", error);
        return { success: false, error: error.message };
      }
      
      // Check if the user is admin after successful login
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
      
      return { success: true, user: data.user };

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
