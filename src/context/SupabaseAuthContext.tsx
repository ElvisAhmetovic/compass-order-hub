// src/context/SupabaseAuthContext.tsx

import { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ExtendedUser, SupabaseAuthContextProps } from "@/types/auth";
import { enhanceUser, checkForAdminSession } from "@/utils/authHelpers";
// Renamed for clarity: import the functions from your authService.ts
import { signIn as authServiceSignIn, signUp as authServiceSignUp, signOut as authServiceSignOut } from "@/services/authService";


const SupabaseAuthContext = createContext<SupabaseAuthContextProps | undefined>(undefined);

export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Check for admin session in localStorage first
    const adminUser = checkForAdminSession();
    if (adminUser) {
      console.log("Found admin user in localStorage:", adminUser);
      setUser(adminUser);
      // For admin users, we don't have a real session, but we can create a dummy one
      setSession({ user: adminUser } as Session);
      setIsLoading(false);
      return;
    }

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log("Auth state changed:", event);
        setSession(currentSession);

        const enhancedUser = enhanceUser(currentSession?.user ?? null);
        setUser(enhancedUser);

        if (event === 'SIGNED_OUT') {
          toast({
            title: "Signed Out",
            description: "You have been signed out successfully.",
          });
        } else if (event === 'SIGNED_IN') {
          toast({
            title: "Signed In",
            description: "Welcome back!",
          });
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      console.log("Got existing session:", currentSession ? "yes" : "no");
      setSession(currentSession);

      const enhancedUser = enhanceUser(currentSession?.user ?? null);
      setUser(enhancedUser);

      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [toast]);

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
        console.log("SupabaseAuthContext: Admin login attempt detected");
      }

      console.log("SupabaseAuthContext: Calling authServiceSignIn with:", {
        email: emailToUse,
        passwordProvided: !!passwordToUse
      });

      // --- THE FIX FOR signIn ---
      const result = await authServiceSignIn({ email: emailToUse, password: passwordToUse });
      // --- END FIX ---

      if (result.success && emailToUse === "luciferbebistar@gmail.com") {
        const adminUser = checkForAdminSession();
        if (adminUser) {
          setUser(adminUser);
          setSession({ user: adminUser } as Session);
        }
      }

      return result;
    } catch (error: any) { // Use any for catch error type or more specific if known
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
      // --- THE FIX FOR signUp ---
      const result = await authServiceSignUp({ email, password, full_name: fullName });
      // --- END FIX ---
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
      await authServiceSignOut(); // This function already returns { error }

      // Explicitly clear user and session state
      setUser(null);
      setSession(null);

      toast({
        title: "Signed Out",
        description: "You have been signed out successfully.",
      });
    } catch (err) {
      console.error("Unexpected error during signOut:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SupabaseAuthContext.Provider value={{ user, session, isLoading, signIn, signUp, signOut }}>
      {/* Conditional rendering for children based on isLoading, as discussed previously, might be needed here */}
      {/* If isLoading is false, then children are rendered. If true, a loading indicator */}
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