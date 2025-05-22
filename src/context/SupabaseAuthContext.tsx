import { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UserRole } from "@/types";

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
  role?: UserRole;
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
      role: (user.user_metadata?.role as UserRole) || 'user'
    };
  };

  // Special helper function to check for admin user in localStorage
  const checkForAdminSession = () => {
    try {
      const userSession = localStorage.getItem("userSession");
      if (userSession) {
        const parsedSession = JSON.parse(userSession);
        if (parsedSession.email === "luciferbebistar@gmail.com" && parsedSession.role === "admin") {
          // Create a custom user object that mimics the structure expected by components
          const adminUser = {
            id: "00000000-0000-0000-0000-000000000000", // Use a valid UUID format
            email: parsedSession.email,
            role: "admin" as UserRole,
            full_name: parsedSession.full_name || "Admin User",
            // Add missing required properties from ExtendedUser/User type
            app_metadata: {},
            aud: "authenticated",
            created_at: new Date().toISOString(),
            user_metadata: {
              role: "admin",
              full_name: parsedSession.full_name || "Admin User"
            }
          } as ExtendedUser;
          
          return adminUser;
        }
      }
      return null;
    } catch (e) {
      console.error("Error checking for admin session:", e);
      return null;
    }
  };

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

  const signIn = async (email: string, password: string): Promise<LoginResult> => {
    try {
      console.log("Sign in attempt with:", { email });
      setIsLoading(true);
      
      // Special case for admin login
      if (email === "luciferbebistar@gmail.com" && password === "Admin@123") {
        // Create a session in localStorage (this mimics what would happen with a real Supabase auth)
        const adminUser = {
          id: "00000000-0000-0000-0000-000000000000", // Use a valid UUID format
          email: email,
          role: "admin",
          full_name: "Admin User"
        };
        
        localStorage.setItem("userSession", JSON.stringify(adminUser));
        
        // Set the user in our context with proper metadata and required User properties
        const enhancedAdminUser = {
          id: "00000000-0000-0000-0000-000000000000", // Use a valid UUID format
          email: email,
          role: "admin" as UserRole,
          full_name: "Admin User",
          // Add required properties from User type
          app_metadata: {},
          aud: "authenticated",
          created_at: new Date().toISOString(),
          user_metadata: {
            role: "admin",
            full_name: "Admin User"
          }
        } as ExtendedUser;
        
        setUser(enhancedAdminUser);
        // Create a pseudo-session for consistency
        setSession({ user: enhancedAdminUser } as Session);
        
        toast({
          title: "Admin Login",
          description: "Welcome back, Administrator!",
        });
        
        console.log("Admin login successful, user set to:", enhancedAdminUser);
        
        return { success: true };
      }
      
      // Fixed: Use correct supabase auth method for email/password login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error("Sign in error:", error.message);
        toast({
          variant: "destructive",
          title: "Login failed",
          description: error.message || "Invalid email or password"
        });
        return { success: false, error: error.message };
      }
      
      console.log("Sign in result:", error ? "Error" : "Success", data);
      
      if (data?.user) {
        toast({
          title: "Signed In",
          description: "You have been signed in successfully.",
        });
      }
      
      return { success: true };
    } catch (error) {
      console.error("Unexpected sign in error:", error);
      toast({
        variant: "destructive",
        title: "Login Error",
        description: "An unexpected error occurred during login"
      });
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
            name: fullName,
            role: 'user' // Explicitly set default role
          }
        }
      });
      
      console.log("Sign up result:", error ? "Error" : "Success", data);
      
      if (error) {
        console.error("Sign up error:", error.message);
        toast({
          variant: "destructive",
          title: "Registration failed",
          description: error.message
        });
        return { success: false, error: error.message };
      }
      
      toast({
        title: "Account Created",
        description: data.user ? "Your account has been created successfully! Please check your email for confirmation." : "Account created! Check your email for confirmation.",
      });
      
      // Important note for development
      console.log("Note: For development, you may want to disable email confirmation in Supabase console settings");
      
      return { success: true };
    } catch (error) {
      console.error("Unexpected sign up error:", error);
      toast({
        variant: "destructive",
        title: "Registration Error",
        description: "An unexpected error occurred during registration"
      });
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
