
import { User } from "@supabase/supabase-js";
import { ExtendedUser } from "@/types/auth";
import { UserRole } from "@/types";

/**
 * Enhances a Supabase User object with additional metadata properties
 * for easier access throughout the application
 */
export const enhanceUser = (user: User | null): ExtendedUser | null => {
  if (!user) return null;
  
  return {
    ...user,
    full_name: user.user_metadata?.full_name || user.user_metadata?.name,
    name: user.user_metadata?.name,
    role: (user.user_metadata?.role as UserRole) || 'user',
    first_name: user.user_metadata?.first_name,
    last_name: user.user_metadata?.last_name
  };
};

/**
 * Checks for an admin session in localStorage
 * This is used for special admin user handling
 */
export const checkForAdminSession = (): ExtendedUser | null => {
  try {
    const userSession = localStorage.getItem("userSession");
    if (userSession) {
      const parsedSession = JSON.parse(userSession);
      if (parsedSession.email === "luciferbebistar@gmail.com" && parsedSession.role === "admin") {
        // Create a custom user object that mimics the structure expected by components
        const adminUser = {
          id: parsedSession.id || "admin-user-id",
          email: parsedSession.email,
          role: "admin" as UserRole,
          full_name: parsedSession.full_name || "Admin User",
          first_name: parsedSession.first_name || "Admin",
          last_name: parsedSession.last_name || "User",
          // Add missing required properties from ExtendedUser/User type
          app_metadata: {},
          aud: "authenticated",
          created_at: new Date().toISOString(),
          user_metadata: {
            role: "admin",
            full_name: parsedSession.full_name || "Admin User",
            first_name: parsedSession.first_name || "Admin",
            last_name: parsedSession.last_name || "User"
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
