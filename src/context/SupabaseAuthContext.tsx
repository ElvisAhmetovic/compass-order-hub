
import { createContext, useContext, ReactNode } from "react";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useSupabaseLogin } from "@/hooks/useSupabaseLogin";
import { useSupabaseRegister } from "@/hooks/useSupabaseRegister";

interface SupabaseAuthContextProps {
  user: ReturnType<typeof useAuthSession>["user"];
  session: ReturnType<typeof useAuthSession>["session"];
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

const SupabaseAuthContext = createContext<SupabaseAuthContextProps | undefined>(undefined);

export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const { user, session, isLoading: sessionLoading, signOut } = useAuthSession();
  const { signIn, isLoading: loginLoading } = useSupabaseLogin();
  const { signUp, isLoading: registerLoading } = useSupabaseRegister();
  
  const isLoading = sessionLoading || loginLoading || registerLoading;

  return (
    <SupabaseAuthContext.Provider value={{ 
      user, 
      session, 
      isLoading, 
      signIn, 
      signUp, 
      signOut 
    }}>
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
