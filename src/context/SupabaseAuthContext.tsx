// src/context/SupabaseAuthContext.tsx

import { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ExtendedUser, SupabaseAuthContextProps } from "@/types/auth";
import { enhanceUser, checkForAdminSession } from "@/utils/authHelpers"; // Ensure authHelpers exists and functions as expected

// Import the functions using their EXACT names from authService.ts
import {
  signInWithEmailAndPassword,
  signUpWithEmailAndPassword,
  signOutUser
} from "@/services/authService";


const SupabaseAuthContext = createContext<SupabaseAuthContextProps | undefined>(undefined);

export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // This useEffect handles the initial session loading and keeps the state updated
  useEffect(() => {
    async function getInitialSession() {
      setIsLoading(true);
      // Check for mock admin session first
      const adminUser = checkForAdminSession();
      if (adminUser) {
        setUser(adminUser);
        setSession({ user: adminUser } as Session); // Cast to Session for type compatibility
        setIsLoading(false);
        return;
      }

      // If not admin, try to get Supabase session
      const { data: { session }, error } = await supabase.auth.getSession();

      if (session) {
        const enhancedUser = enhanceUser(session.user);
        setUser(enhancedUser);
        setSession(session);
      } else {
        setUser(null);
        setSession(null);
      }
      setIsLoading(false);
      
      if (error) {
        console.error("SupabaseAuthContext: Error getting initial session:", error);
      }
    }

    getInitialSession();

    // Set up a listener for auth state changes (login, logout, token refresh)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log("Auth State Change:", event, currentSession);
        if (event === "SIGNED_IN" && currentSession) {
          const enhancedUser = enhanceUser(currentSession.user);
          setUser(enhancedUser);
          setSession(currentSession);
          toast({
            title: "Logged In",
            description: "You have been successfully logged in.",
          });
        } else if (event === "SIGNED_OUT") {
          setUser(null);
          setSession(null);
          toast({
            title: "Logged Out",
            description: "You have been successfully logged out.",
          });
        } else if (event === "USER_UPDATED" && currentSession) {
          const enhancedUser = enhanceUser(currentSession.user);
          setUser(enhancedUser);
          setSession(currentSession);
          toast({
            title: "Profile Updated",
            description: "Your profile information has been updated.",
          });
        }
        setIsLoading(false);
      }
    );

    return () => {
      authListener?.unsubscribe();
    };
  }, [toast]); // Include toast in dependency array if it's stable


  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      console.log("SupabaseAuthContext: signIn called with:", {
        emailProvided: !!email,
        passwordLength: password ? password.length : 0,
        emailValue: email,
      });

      const emailToUse = typeof email === 'string' ? email.trim() : '';
      const passwordToUse = typeof password === 'string' ? password : '';

      if (!emailToUse || !passwordToUse) {
        console.error("SupabaseAuthContext: Empty credentials detected:", {
          emailEmpty: !emailToUse,
          passwordEmpty: !passwordToUse
        });
        return {
          success: false,
          error: "Email and password are required"
        };
      }

      if (emailToUse === "luciferbebistar@gmail.com") {
        console.log("SupabaseAuthContext: Admin login attempt detected, handing off to authService");
      }

      console.log("SupabaseAuthContext: Calling authService's signInWithEmailAndPassword with:", {
        email: emailToUse,
        passwordProvided: !!passwordToUse
      });

      const result = await signInWithEmailAndPassword(emailToUse, passwordToUse);
      
      // If admin login was successful, update state directly from mock
      if (result.success && emailToUse === "luciferbebistar@gmail.com") {
        const adminUser = checkForAdminSession(); // Retrieve the mock admin user
        if (adminUser) {
          setUser(adminUser);
          setSession({ user: adminUser } as Session); // Mimic a session for admin
        }
      }

      return result;
    } catch (error: any) {
      console.error("SupabaseAuthContext: Unexpected error during signIn:", error);
      return {
        success: false,
        error: error.message || "An unexpected authentication error occurred."
      };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    setIsLoading(true);
    try {
      const result = await signUpWithEmailAndPassword(email, password, fullName);
      return result;
    } catch (error: any) {
        console.error("SupabaseAuthContext: Unexpected error during signUp:", error);
        return {
            success: false,
            error: error.message || "An unexpected registration error occurred."
        };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      await signOutUser();

      // Explicitly clear user and session state on sign out
      setUser(null);
      setSession(null);

      toast({
        title: "Signed Out",
        description: "You have been signed out successfully.",
      });
    } catch (err) {
      console.error("SupabaseAuthContext: Unexpected error during signOut:", err);
      toast({
        variant: "destructive",
        title: "Sign Out Failed",
        description: "There was an issue signing you out. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SupabaseAuthContext.Provider value={{ user, session, isLoading, signIn, signUp, signOut }}>
      {isLoading ? (
        <div className="flex justify-center items-center h-screen text-lg text-gray-500">
          Initializing authentication...
        </div>
      ) : (
        children
      )}
    </SupabaseAuthContext.Provider>
  );
}

export function useSupabaseAuth() {
  const context = useContext(SupabaseAuthContext);

  if (context === undefined) {
    throw new Error("useSupabaseAuth must be used within a SupabaseAuthProvider");
  }

  return context;
}
