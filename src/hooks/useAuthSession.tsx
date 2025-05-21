
import { useState, useEffect, useContext, createContext, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AuthSessionContextProps {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthSessionContext = createContext<AuthSessionContextProps | undefined>(undefined);

export function AuthSessionProvider({ children }: { children: ReactNode }) {
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
              if (!adminUserExists && currentSession?.user) {
                updatedAppUsers.push({
                  id: currentSession.user.id,
                  email: "luciferbebistar@gmail.com",
                  role: "admin",
                  full_name: currentSession.user.user_metadata?.full_name || "Admin User",
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

      // If admin is already logged in, ensure their role is set
      if (currentSession?.user?.email === "luciferbebistar@gmail.com") {
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
          if (!adminExists && currentSession?.user) {
            updatedAppUsers.push({
              id: currentSession.user.id,
              email: "luciferbebistar@gmail.com",
              role: "admin",
              full_name: currentSession.user.user_metadata?.full_name || "Admin User",
              created_at: new Date().toISOString()
            });
          }
          
          localStorage.setItem("app_users", JSON.stringify(updatedAppUsers));
        } catch (error) {
          console.error("Error updating admin role in localStorage:", error);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [toast]);

  const signOut = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    setIsLoading(false);
  };

  return (
    <AuthSessionContext.Provider value={{ user, session, isLoading, signOut }}>
      {children}
    </AuthSessionContext.Provider>
  );
}

export function useAuthSession() {
  const context = useContext(AuthSessionContext);
  
  if (context === undefined) {
    throw new Error("useAuthSession must be used within an AuthSessionProvider");
  }
  
  return context;
}
