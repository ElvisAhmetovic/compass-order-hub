
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useSupabaseAuth } from "./SupabaseAuthContext";
import { UserRole } from "@/types";
import { ExtendedUser } from "@/types/auth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Define what our authentication context will contain
interface AuthContextType {
  user: ExtendedUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUserProfile: (data: { first_name: string; last_name: string }) => Promise<boolean>;
  updatePassword: (newPassword: string) => Promise<boolean>;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// The provider component that will wrap our app
export function AuthProvider({ children }: { children: ReactNode }) {
  // Get auth state from Supabase context
  const { user: supabaseUser, isLoading: supabaseLoading, signIn, signOut } = useSupabaseAuth();
  const { toast } = useToast();
  
  // Wrapper functions for Supabase auth methods
  const login = async (email: string, password: string) => {
    console.log("AuthContext: login called with:", { emailProvided: !!email, passwordLength: password?.length });
    return await signIn(email, password);
  };

  const logout = async () => {
    console.log("AuthContext: logout called");
    try {
      await signOut();
    } catch (error) {
      console.error("AuthContext: Error during logout:", error);
    }
  };

  // Add the missing updateUserProfile function
  const updateUserProfile = async (data: { first_name: string; last_name: string }) => {
    if (!supabaseUser?.id) return false;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: data.first_name,
          last_name: data.last_name,
          updated_at: new Date()
        })
        .eq('id', supabaseUser.id);
      
      if (error) {
        console.error("Error updating profile:", error);
        toast({
          variant: "destructive",
          title: "Profile update failed",
          description: error.message
        });
        return false;
      }
      
      return true;
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        variant: "destructive",
        title: "Profile update failed",
        description: error.message
      });
      return false;
    }
  };

  // Add the missing updatePassword function
  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) {
        console.error("Error updating password:", error);
        toast({
          variant: "destructive",
          title: "Password update failed",
          description: error.message
        });
        return false;
      }
      
      return true;
    } catch (error: any) {
      console.error("Error updating password:", error);
      toast({
        variant: "destructive",
        title: "Password update failed",
        description: error.message
      });
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user: supabaseUser as ExtendedUser | null,
        isLoading: supabaseLoading,
        login,
        logout,
        updateUserProfile,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  
  return context;
}
