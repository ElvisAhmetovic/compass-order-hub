
import { supabase } from "@/integrations/supabase/client";

/**
 * Sign up a new user with email and password
 */
export async function signUp({ email, password, full_name }: { email: string; password: string; full_name?: string }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name,
      },
    },
  });

  return { data, error };
}

/**
 * Sign in a user with email and password
 */
export async function signIn({ email, password }: { email: string; password: string }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return { data, error };
}

/**
 * Sign out the current user
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

/**
 * Get the current session
 */
export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession();
  return { session: data.session, error };
}

/**
 * Get the current user profile
 */
export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  return { profile: data, error };
}

/**
 * Update the current user profile
 */
export async function updateUserProfile(userId: string, updates: { first_name?: string; last_name?: string; role?: string }) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId);

  return { data, error };
}
