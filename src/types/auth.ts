// src/types/auth.ts (or relevant file)

import { Session, User } from "@supabase/supabase-js";
import { UserRole } from "@/types"; // Assuming this is defined elsewhere

export interface LoginResult {
  success: boolean;
  error?: string;
  // Potentially add user/session here if your signIn also returns them
  // user?: User | null;
  // session?: Session | null;
}

export interface SignUpResult {
  success: boolean;
  error?: string;
  // ADD THIS LINE:
  needsEmailConfirmation?: boolean; // <-- THIS IS THE MISSING PIECE
  // Potentially add user/session here if your signUp also returns them
  // user?: User | null;
  // session?: Session | null;
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
  // Update the return types of signIn and signUp to include the full results
  signIn: (email: string, password: string) => Promise<LoginResult>; // This is correct as per your LoginResult
  signUp: (email: string, password: string, fullName: string) => Promise<SignUpResult>; // This is correct as per your SignUpResult
  signOut: () => Promise<void>;
}