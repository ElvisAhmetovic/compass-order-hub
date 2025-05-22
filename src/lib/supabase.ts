// src/lib/supabase.ts

import { supabase } from "@/integrations/supabase/client";

// REMOVE signIn, signUp, signOut from here as they are handled in src/services/authService.ts

/**
 * Get the current session
 */
export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession();
  return { session: data.session, error };
}

/**
 * Get the current user profile from the 'profiles' table
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
 * Update the current user profile in the 'profiles' table
 */
export async function updateUserProfile(userId: string, updates: { first_name?: string; last_name?: string; role?: string }) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId);

  return { data, error };
}

// Add other non-auth related Supabase functions here if needed,
// e.g., fetching orders, companies, etc.