
import { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SupabaseAuthContextProps {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

const SupabaseAuthContext = createContext<SupabaseAuthContextProps | undefined>(undefined);

export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
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
          
          // Check if it's the admin user and ensure their role is set correctly
          if (currentSession?.user?.email === "luciferbebistar@gmail.com") {
            // Update app_users and users in localStorage for the admin
            try {
              // Update in app_users storage
              const appUsers = JSON.parse(localStorage.getItem("app_users") || "[]");
              let adminUserExists = false;
              
              const updatedAppUsers = appUsers.map((u: any) => {
                if (u.email === "luciferbebistar@gmail.com") {
                  adminUserExists = true;
                  return { ...u, role: "admin" };
                }
                return u;
              });
              
              // If admin doesn't exist, add them
              if (!adminUserExists) {
                updatedAppUsers.push({
                  id: currentSession.user.id,
                  email: "luciferbebistar@gmail.com",
                  role: "admin",
                  full_name: "Admin User",
                  created_at: new Date().toISOString()
                });
              }
              
              localStorage.setItem("app_users", JSON.stringify(updatedAppUsers));
              console.log("Admin role updated in app_users");
            } catch (error) {
              console.error("Error updating admin role in app_users:", error);
            }
          }
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [toast]);

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      // Special handling for admin user
      if (email === "luciferbebistar@gmail.com" && password === "Admin@123") {
        console.log("Admin login attempt");
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      // Special handling for admin user after successful login
      if (email === "luciferbebistar@gmail.com") {
        try {
          // Update in app_users storage
          const appUsers = JSON.parse(localStorage.getItem("app_users") || "[]");
          let adminExists = false;
          
          const updatedAppUsers = appUsers.map((u: any) => {
            if (u.email === "luciferbebistar@gmail.com") {
              adminExists = true;
              return { ...u, role: "admin" };
            }
            return u;
          });
          
          // If admin doesn't exist, add them
          if (!adminExists && data.user) {
            updatedAppUsers.push({
              id: data.user.id,
              email: "luciferbebistar@gmail.com",
              role: "admin",
              full_name: "Admin User",
              created_at: new Date().toISOString()
            });
          }
          
          localStorage.setItem("app_users", JSON.stringify(updatedAppUsers));
          console.log("Admin credentials set in storage");
        } catch (error) {
          console.error("Error updating admin in storage:", error);
        }
      }
      
      return { success: true };
    } catch (error) {
      return { success: false, error: "An unexpected error occurred" };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      setIsLoading(true);
      
      // Special handling for admin user registration
      const userMetadata = { full_name: fullName };
      if (email === "luciferbebistar@gmail.com" && password === "Admin@123") {
        Object.assign(userMetadata, { role: "admin" });
        console.log("Creating admin account");
      }
      
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: userMetadata
        }
      });
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      toast({
        title: "Account Created",
        description: "Your account has been created successfully!",
      });
      
      return { success: true };
    } catch (error) {
      return { success: false, error: "An unexpected error occurred" };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
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
