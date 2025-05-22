
import { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ExtendedUser, SupabaseAuthContextProps } from "@/types/auth";
import { enhanceUser, checkForAdminSession } from "@/utils/authHelpers";
import { signInWithEmailAndPassword, signUpWithEmailAndPassword, signOutUser } from "@/services/authService";

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
      // Add extensive debug logging to track the issue
      console.log("SupabaseAuthContext: signIn called with:", { 
        emailProvided: !!email, 
        passwordLength: password ? password.length : 0,
        emailValue: email, // Log the actual email for debugging - remove in production!
      });
      
      // Ensure we're working with strings and they're properly trimmed
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

      // Special admin login case
      if (emailToUse === "luciferbebistar@gmail.com") {
        console.log("SupabaseAuthContext: Admin login attempt detected");
      }
      
      console.log("SupabaseAuthContext: Calling signInWithEmailAndPassword with:", { 
        email: emailToUse,
        passwordProvided: !!passwordToUse 
      });
      
      const result = await signInWithEmailAndPassword(emailToUse, passwordToUse);
      
      // If using the special admin login case, we need to update our context state
      if (result.success && emailToUse === "luciferbebistar@gmail.com") {
        const adminUser = checkForAdminSession();
        if (adminUser) {
          setUser(adminUser);
          setSession({ user: adminUser } as Session);
        }
      }
      
      return result;
    } catch (error) {
      console.error("SupabaseAuthContext: Unexpected error during signIn:", error);
      return {
        success: false,
        error: "An unexpected authentication error occurred."
      };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    setIsLoading(true);
    try {
      return await signUpWithEmailAndPassword(email, password, fullName);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      await signOutUser();
      
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
      {children}
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
