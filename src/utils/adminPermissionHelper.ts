
import { User, UserRole } from "@/types";

/**
 * Utility function to assign admin role to a specific user by email
 * @param email The email address to grant admin permissions to
 */
export const assignAdminPermission = (email: string): void => {
  try {
    // Get users from local storage
    const appUsers = JSON.parse(localStorage.getItem("app_users") || "[]");
    const authUsers = JSON.parse(localStorage.getItem("users") || "[]");
    
    // Create unique user ID
    const userId = `user-${Date.now()}`;
    
    // Check if the user exists in app_users
    const appUserIndex = appUsers.findIndex((user: User) => user.email === email);
    
    if (appUserIndex !== -1) {
      // User exists, update their role
      appUsers[appUserIndex].role = 'admin' as UserRole;
      localStorage.setItem("app_users", JSON.stringify(appUsers));
      console.log(`Updated user ${email} to admin in app_users`);
    } else {
      // User doesn't exist, create a new admin user
      const newUser: User = {
        id: userId,
        email,
        role: 'admin' as UserRole,
        full_name: "Admin User",
        created_at: new Date().toISOString()
      };
      appUsers.push(newUser);
      localStorage.setItem("app_users", JSON.stringify(appUsers));
      console.log(`Created new admin user ${email} in app_users`);
    }
    
    // Also check in authentication users
    const authUserIndex = authUsers.findIndex((user: any) => user.email === email);
    
    if (authUserIndex !== -1) {
      // User exists, update their role
      authUsers[authUserIndex].role = 'admin';
      // Ensure password hash is set
      if (!authUsers[authUserIndex].passwordHash) {
        authUsers[authUserIndex].passwordHash = btoa("Admin@123");
      }
      localStorage.setItem("users", JSON.stringify(authUsers));
      console.log(`Updated user ${email} to admin in authentication users`);
    } else {
      // User doesn't exist in auth users, create a new entry with a default password
      const defaultPassword = "Admin@123"; // Default admin password (not encoded)
      const passwordHash = btoa(defaultPassword); // Encode password for storage
      
      const newAuthUser = {
        id: userId, // Use the same ID as in app_users
        email,
        role: 'admin',
        full_name: "Admin User",
        passwordHash: passwordHash,
        created_at: new Date().toISOString()
      };
      authUsers.push(newAuthUser);
      localStorage.setItem("users", JSON.stringify(authUsers));
      console.log(`Created new admin user ${email} in authentication users with default password`);
      
      // Log the generated credentials for visibility (remove in production)
      console.log(`Admin login credentials - Email: ${email}, Password: ${defaultPassword}`);
    }
    
    // Check if user is currently logged in
    const currentSession = localStorage.getItem('userSession');
    if (currentSession) {
      const session = JSON.parse(currentSession);
      if (session.email === email) {
        // Update the current session if this user is logged in
        session.role = 'admin';
        localStorage.setItem('userSession', JSON.stringify(session));
        console.log(`Updated current session for ${email} to admin role`);
      }
    }
    
  } catch (error) {
    console.error("Error updating admin permissions:", error);
  }
};
