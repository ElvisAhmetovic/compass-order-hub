// src/context/SupabaseAuthContext.tsx

import { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client"; // Keep this
import { useToast } from "@/hooks/use-toast";
import { ExtendedUser, SupabaseAuthContextProps } from "@/types/auth";
import { enhanceUser, checkForAdminSession } from "@/utils/authHelpers";
// --- REVERT THIS LINE ---
// From: import { signIn as authServiceSignIn, signUp as authServiceSignUp, signOut as authServiceSignOut } from "@/services/authService";
// To:
import { signIn, signUp, signOut } from "@/services/authService"; // <-- DIRECTLY IMPORT THE EXPORTED NAMES
// --- END REVERT ---


const SupabaseAuthContext = createContext<SupabaseAuthContextProps | undefined>(undefined);

export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // ... (rest of your useEffect for auth state listener and initial session)

  const signIn = async (email: string, password: string) => { // This is the context's signIn
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

      console.log("SupabaseAuthContext: Calling authService's signIn with:", {
        email: emailToUse,
        passwordProvided: !!passwordToUse
      });

      // --- THE CALL TO authService.ts's signIn ---
      const result = await signIn({ email: emailToUse, password: passwordToUse }); // <-- CALL THE IMPORTED 'signIn' (which is from authService.ts)
      // --- END CALL ---

      if (result.success && emailToUse === "luciferbebistar@gmail.com") {
        const adminUser = checkForAdminSession();
        if (adminUser) {
          setUser(adminUser);
          setSession({ user: adminUser } as Session);
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

  const signUp = async (email: string, password: string, fullName: string) => { // This is the context's signUp
    setIsLoading(true);
    try {
      // --- THE CALL TO authService.ts's signUp ---
      const result = await signUp({ email, password, full_name: fullName }); // <-- CALL THE IMPORTED 'signUp' (which is from authService.ts)
      // --- END CALL ---
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

  const signOut = async () => { // This is the context's signOut
    try {
      setIsLoading(true);
      await signOut(); // <-- CALL THE IMPORTED 'signOut' (which is from authService.ts)

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
      {/* ... (rest of the context provider's return) */}
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