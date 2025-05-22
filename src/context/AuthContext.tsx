
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useSupabaseAuth } from "./SupabaseAuthContext";
import { UserRole } from "@/types";
import { ExtendedUser } from "@/types/auth";

// Define what our authentication context will contain
interface AuthContextType {
  user: ExtendedUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// The provider component that will wrap our app
export function AuthProvider({ children }: { children: ReactNode }) {
  // Get auth state from Supabase context
  const { user: supabaseUser, isLoading: supabaseLoading, signIn, signOut } = useSupabaseAuth();
  
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

  return (
    <AuthContext.Provider
      value={{
        user: supabaseUser,
        isLoading: supabaseLoading,
        login,
        logout,
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
