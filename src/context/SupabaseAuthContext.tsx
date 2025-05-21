
import { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface LoginResult {
  success: boolean;
  error?: string;
}

interface SupabaseAuthContextProps {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<LoginResult>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

// Extended User type to include common properties for easier access
export interface ExtendedUser extends User {
  full_name?: string;
  name?: string;
  role?: string;
}

const SupabaseAuthContext = createContext<SupabaseAuthContextProps | undefined>(undefined);

export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Helper function to enhance user object with metadata properties
  const enhanceUser = (user: User | null): ExtendedUser | null => {
    if (!user) return null;
    
    return {
      ...user,
      full_name: user.user_metadata?.full_name || user.user_metadata?.name,
      name: user.user_metadata?.name,
      role: user.user_metadata?.role || 'user'
    };
  };

  useEffect(() => {
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

  const signIn = async (email: string, password: string): Promise<LoginResult> => {
    try {
      console.log("Sign in attempt with:", { email });
      setIsLoading(true);
      
      // Special case for admin login
      if (email === "luciferbebistar@gmail.com" && password === "Admin@123") {
        // Create a session in localStorage (this mimics what would happen with a real Supabase auth)
        const adminUser = {
          id: "admin-user-id",
          email: email,
          role: "admin",
          full_name: "Admin User"
        };
        
        localStorage.setItem("userSession", JSON.stringify(adminUser));
        
        // Set the user in our context
        setUser(adminUser as any);
        
        toast({
          title: "Admin Login",
          description: "Welcome back, Administrator!",
        });
        
        return { success: true };
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      console.log("Sign in result:", error ? "Error" : "Success", data);
      
      if (error) {
        console.error("Sign in error:", error.message);
        return { success: false, error: error.message };
      }
      
      return { success: true };
    } catch (error) {
      console.error("Unexpected sign in error:", error);
      return { success: false, error: "An unexpected error occurred" };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log("Sign up attempt with:", { email, fullName });
      setIsLoading(true);
      
      // Store full_name in user_metadata
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            full_name: fullName,
            name: fullName
          }
        }
      });
      
      console.log("Sign up result:", error ? "Error" : "Success", data);
      
      if (error) {
        console.error("Sign up error:", error.message);
        return { success: false, error: error.message };
      }
      
      toast({
        title: "Account Created",
        description: "Your account has been created successfully!",
      });
      
      return { success: true };
    } catch (error) {
      console.error("Unexpected sign up error:", error);
      return { success: false, error: "An unexpected error occurred" };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    
    // Check if we have a special admin session
    const userSession = localStorage.getItem("userSession");
    if (userSession) {
      try {
        const parsedSession = JSON.parse(userSession);
        if (parsedSession.email === "luciferbebistar@gmail.com") {
          localStorage.removeItem("userSession");
          setUser(null);
          setSession(null);
          
          toast({
            title: "Signed Out",
            description: "Admin user has been signed out.",
          });
          
          setIsLoading(false);
          return;
        }
      } catch (e) {
        // If parsing fails, continue with normal signOut
        console.error("Error parsing user session:", e);
      }
    }
    
    await supabase.auth.signOut();
    setIsLoading(false);
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
