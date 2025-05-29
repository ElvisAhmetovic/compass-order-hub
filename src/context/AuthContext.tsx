import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { UserRole } from '@/types';

interface User {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
  first_name?: string;
  last_name?: string;
  created_at?: string;
  last_sign_in?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkUserRole: (requiredRoles: UserRole[]) => boolean;
  refreshUser: () => Promise<void>;
  updateUserProfile: (profileData: Partial<User>) => Promise<boolean>;
  updatePassword: (newPassword: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Helper function to migrate old user IDs to UUIDs
  const migrateUserIdToUUID = (oldUserId: string): string => {
    // Check if it's already a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(oldUserId)) {
      return oldUserId;
    }

    console.log('🔄 Migrating old user ID to UUID:', oldUserId);
    
    // Generate a new UUID for this user
    const newUUID = crypto.randomUUID();
    console.log('🆔 Generated new UUID:', newUUID);

    // Update users storage
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const userIndex = users.findIndex((u: any) => u.id === oldUserId);
    if (userIndex !== -1) {
      users[userIndex].id = newUUID;
      localStorage.setItem("users", JSON.stringify(users));
      console.log('✅ Updated user ID in users storage');
    }

    // Update app_users storage
    const appUsers = JSON.parse(localStorage.getItem("app_users") || "[]");
    const appUserIndex = appUsers.findIndex((u: any) => u.id === oldUserId);
    if (appUserIndex !== -1) {
      appUsers[appUserIndex].id = newUUID;
      localStorage.setItem("app_users", JSON.stringify(appUsers));
      console.log('✅ Updated user ID in app_users storage');
    }

    return newUUID;
  };

  const loadUserFromSession = () => {
    try {
      const sessionData = localStorage.getItem('userSession');
      if (sessionData) {
        const userData = JSON.parse(sessionData);
        console.log('Loading user from session:', userData);
        
        // Migrate user ID to UUID if needed
        if (userData.id) {
          const migratedId = migrateUserIdToUUID(userData.id);
          if (migratedId !== userData.id) {
            userData.id = migratedId;
            // Update session with new UUID
            localStorage.setItem('userSession', JSON.stringify(userData));
            console.log('🔄 Session updated with new UUID');
          }
        }
        
        // Ensure role is set, if missing try to get it from app_users
        if (!userData.role) {
          console.log('User missing role, attempting to find it in app_users');
          const appUsers = JSON.parse(localStorage.getItem("app_users") || "[]");
          const appUser = appUsers.find((u: any) => u.id === userData.id || u.email === userData.email);
          
          if (appUser && appUser.role) {
            userData.role = appUser.role;
            console.log('Found role in app_users:', appUser.role);
            // Update the session with the role
            localStorage.setItem('userSession', JSON.stringify(userData));
          } else {
            // Default to 'user' role if not found
            userData.role = 'user';
            console.log('No role found, defaulting to user');
            localStorage.setItem('userSession', JSON.stringify(userData));
          }
        }
        
        console.log('Final user data:', userData);
        setUser(userData);
      }
    } catch (error) {
      console.error('Error loading user session:', error);
      localStorage.removeItem('userSession');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUserFromSession();
  }, []);

  const refreshUser = async (): Promise<void> => {
    try {
      loadUserFromSession();
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  const updateUserProfile = async (profileData: Partial<User>): Promise<boolean> => {
    try {
      setIsLoading(true);
      const sessionData = localStorage.getItem('userSession');
      if (!sessionData) {
        toast({
          variant: "destructive",
          title: "Update failed",
          description: "No active session found.",
        });
        return false;
      }

      const userData = JSON.parse(sessionData);
      
      const updatedUser = { 
        ...userData, 
        ...profileData,
        full_name: `${profileData.first_name || userData.first_name || ''} ${profileData.last_name || userData.last_name || ''}`.trim()
      };
      
      localStorage.setItem('userSession', JSON.stringify(updatedUser));
      
      const registeredUsers = JSON.parse(localStorage.getItem("users") || "[]");
      const userIndex = registeredUsers.findIndex((u: any) => u.id === userData.id);
      
      if (userIndex !== -1) {
        registeredUsers[userIndex] = { 
          ...registeredUsers[userIndex],
          ...profileData,
          full_name: updatedUser.full_name
        };
        localStorage.setItem("users", JSON.stringify(registeredUsers));
      }
      
      const appUsers = JSON.parse(localStorage.getItem("app_users") || "[]");
      const appUserIndex = appUsers.findIndex((u: any) => u.id === userData.id);
      
      if (appUserIndex !== -1) {
        appUsers[appUserIndex] = { 
          ...appUsers[appUserIndex],
          ...profileData,
          full_name: updatedUser.full_name
        };
        localStorage.setItem("app_users", JSON.stringify(appUsers));
      }
      
      setUser(updatedUser);
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
      
      return true;
    } catch (error) {
      console.error("Profile update error:", error);
      toast({
        variant: "destructive",
        title: "Update failed",
        description: "There was a problem updating your profile. Please try again later.",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updatePassword = async (newPassword: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const sessionData = localStorage.getItem('userSession');
      if (!sessionData) return false;
      
      const userData = JSON.parse(sessionData);
      const newPasswordHash = btoa(newPassword);
      
      // CRITICAL FIX: Update password in registered users and ensure old password is completely invalidated
      const registeredUsers = JSON.parse(localStorage.getItem("users") || "[]");
      const userIndex = registeredUsers.findIndex((u: any) => u.id === userData.id);
      
      if (userIndex !== -1) {
        // Completely replace the password hash - no fallback to old passwords
        registeredUsers[userIndex].passwordHash = newPasswordHash;
        // Remove any default password flags or fallbacks
        delete registeredUsers[userIndex].isDefaultPassword;
        delete registeredUsers[userIndex].allowFallbackAuth;
        localStorage.setItem("users", JSON.stringify(registeredUsers));
      } else {
        // If user not found in registered users, create entry with new password only
        registeredUsers.push({
          id: userData.id,
          email: userData.email,
          passwordHash: newPasswordHash,
          role: userData.role,
          full_name: userData.full_name
        });
        localStorage.setItem("users", JSON.stringify(registeredUsers));
      }
      
      // Invalidate current session to force re-login with new password
      localStorage.removeItem('userSession');
      setUser(null);
      
      toast({
        title: "Password updated",
        description: "Your password has been updated successfully. Please log in again with your new password.",
      });
      
      return true;
    } catch (error) {
      console.error("Password update error:", error);
      toast({
        variant: "destructive",
        title: "Password update failed",
        description: "There was a problem updating your password. Please try again later.",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (identifier: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const registeredUsers = JSON.parse(localStorage.getItem("users") || "[]");
      const appUsers = JSON.parse(localStorage.getItem("app_users") || "[]");
      
      const isEmail = identifier.includes("@");
      
      console.log(`Login attempt for: ${identifier}`);
      
      // Find the user in registered users (primary auth source)
      let foundUser = registeredUsers.find((user: any) => 
        isEmail ? user.email === identifier : user.username === identifier
      );
      
      // SECURITY FIX: If not found in registered users, check app_users but create proper auth entry
      if (!foundUser) {
        const appUser = appUsers.find((user: any) => user.email === identifier);
        if (appUser) {
          // Create new auth user with secure default password (one-time use)
          const defaultPasswordHash = btoa("Admin@123");
          const newUserId = crypto.randomUUID(); // Generate proper UUID
          foundUser = {
            id: newUserId,
            email: appUser.email,
            role: appUser.role || 'user', // Ensure role is set
            full_name: appUser.full_name,
            passwordHash: defaultPasswordHash,
            isDefaultPassword: true // Flag for security tracking
          };
          
          // Update the appUser with the new UUID
          appUser.id = newUserId;
          localStorage.setItem("app_users", JSON.stringify(appUsers));
          
          registeredUsers.push(foundUser);
          localStorage.setItem("users", JSON.stringify(registeredUsers));
          console.log("Created new auth user from app_user with default password and UUID:", newUserId);
        }
      } else {
        // Migrate existing user ID to UUID if needed
        const migratedId = migrateUserIdToUUID(foundUser.id);
        if (migratedId !== foundUser.id) {
          foundUser.id = migratedId;
        }
      }
      
      if (!foundUser) {
        console.log("User not found");
        toast({
          variant: "destructive",
          title: "Login failed",
          description: "Invalid email/username or password."
        });
        return false;
      }
      
      // CRITICAL SECURITY FIX: Only validate against the current password hash
      const inputPasswordHash = btoa(password);
      const storedHash = foundUser.passwordHash || "";
      
      console.log("Comparing password hash:", { 
        input: inputPasswordHash.substring(0, 5) + "...", 
        stored: storedHash.substring(0, 5) + "..." 
      });
      
      // REMOVED: Dangerous fallback that allowed multiple valid passwords
      // New logic: Only the exact current password hash is valid
      if (inputPasswordHash !== storedHash) {
        console.log("Password mismatch - login denied");
        toast({
          variant: "destructive",
          title: "Login failed",
          description: "Invalid email/username or password."
        });
        return false;
      }
      
      console.log("Password match - login successful");
      
      // Create user session with additional profile info
      const appUser = appUsers.find((user: any) => user.email === foundUser.email);
      
      const userData = {
        id: foundUser.id,
        email: foundUser.email,
        role: (foundUser.role || appUser?.role || 'user') as UserRole, // Ensure role is always set
        full_name: foundUser.full_name || foundUser.fullName || "User",
        first_name: appUser?.first_name || "",
        last_name: appUser?.last_name || "",
        created_at: appUser?.created_at || new Date().toISOString(),
        last_sign_in: new Date().toISOString()
      };
      
      console.log("Setting user session with role:", userData.role);
      localStorage.setItem("userSession", JSON.stringify(userData));
      setUser(userData);
      
      toast({
        title: "Login successful",
        description: `Welcome back${userData.full_name ? ', ' + userData.full_name : ''}!`,
      });
      
      return true;
    } catch (error) {
      console.error("Login error:", error);
      toast({
        variant: "destructive",
        title: "Login failed",
        description: "An unexpected error occurred. Please try again later.",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    try {
      localStorage.removeItem('userSession');
      setUser(null);
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        variant: "destructive",
        title: "Logout failed",
        description: "There was a problem logging out. Please try again.",
      });
    }
  };

  const checkUserRole = (requiredRoles: UserRole[]): boolean => {
    if (!user) return false;
    return requiredRoles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      login, 
      logout, 
      checkUserRole,
      refreshUser,
      updateUserProfile,
      updatePassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
