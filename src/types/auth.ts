
import { Session, User } from "@supabase/supabase-js";
import { UserRole } from "@/types";

export interface LoginResult {
  success: boolean;
  error?: string;
}

export interface SignUpResult {
  success: boolean;
  error?: string;
}

// Extended User type to include common properties for easier access
export interface ExtendedUser extends User {
  full_name?: string;
  name?: string;
  role?: UserRole;
}

export interface SupabaseAuthContextProps {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<LoginResult>;
  signUp: (email: string, password: string, fullName: string) => Promise<SignUpResult>;
  signOut: () => Promise<void>;
}
