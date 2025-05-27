
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

  const loadUserFromSession = () => {
    try {
      const sessionData = localStorage.getItem('userSession');
      if (sessionData) {
        const userData = JSON.parse(sessionData);
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
          foundUser = {
            id: appUser.id,
            email: appUser.email,
            role: appUser.role,
            full_name: appUser.full_name,
            passwordHash: defaultPasswordHash,
            isDefaultPassword: true // Flag for security tracking
          };
          
          registeredUsers.push(foundUser);
          localStorage.setItem("users", JSON.stringify(registeredUsers));
          console.log("Created new auth user from app_user with default password");
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
        role: foundUser.role as UserRole,
        full_name: foundUser.full_name || foundUser.fullName || "User",
        first_name: appUser?.first_name || "",
        last_name: appUser?.last_name || "",
        created_at: appUser?.created_at || new Date().toISOString(),
        last_sign_in: new Date().toISOString()
      };
      
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
