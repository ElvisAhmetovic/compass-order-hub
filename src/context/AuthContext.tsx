
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();

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
      // For now just reload from localStorage, but in a real app with Supabase,
      // you'd fetch fresh data from the server
      loadUserFromSession();
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  const updateUserProfile = async (profileData: Partial<User>): Promise<boolean> => {
    try {
      setIsLoading(true);
      // Get current user data
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
      
      // In a real app, you'd call Supabase here
      // For this demo, we'll simulate by updating localStorage
      const updatedUser = { 
        ...userData, 
        ...profileData,
        full_name: `${profileData.first_name || userData.first_name || ''} ${profileData.last_name || userData.last_name || ''}`.trim()
      };
      
      // Update in localStorage
      localStorage.setItem('userSession', JSON.stringify(updatedUser));
      
      // Update registered users if found
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
      
      // Update app_users if found
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
      
      // Update user in context
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
      // Get current user data
      const sessionData = localStorage.getItem('userSession');
      if (!sessionData) return false;
      
      const userData = JSON.parse(sessionData);
      
      // In a real app with Supabase, you'd call auth.updateUser({password: newPassword})
      // For this mock implementation, we'll update the passwordHash in localStorage
      
      // Update in registered users
      const registeredUsers = JSON.parse(localStorage.getItem("users") || "[]");
      const userIndex = registeredUsers.findIndex((u: any) => u.id === userData.id);
      
      if (userIndex !== -1) {
        const newPasswordHash = btoa(newPassword);
        registeredUsers[userIndex].passwordHash = newPasswordHash;
        localStorage.setItem("users", JSON.stringify(registeredUsers));
      } else {
        // If user not found in registered users, create entry
        const newPasswordHash = btoa(newPassword);
        registeredUsers.push({
          id: userData.id,
          email: userData.email,
          passwordHash: newPasswordHash,
          role: userData.role,
          full_name: userData.full_name
        });
        localStorage.setItem("users", JSON.stringify(registeredUsers));
      }
      
      toast({
        title: "Password updated",
        description: "Your password has been updated successfully.",
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
      
      // Get users from both local storage sources
      const registeredUsers = JSON.parse(localStorage.getItem("users") || "[]");
      const appUsers = JSON.parse(localStorage.getItem("app_users") || "[]");
      
      // Check if identifier is username or email
      const isEmail = identifier.includes("@");
      
      // For debugging
      console.log(`Login attempt for: ${identifier}`);
      
      // Find the user in registered users
      let foundUser = registeredUsers.find((user: any) => 
        isEmail ? user.email === identifier : user.username === identifier
      );
      
      // If not found in registered users, check app_users
      if (!foundUser) {
        const appUser = appUsers.find((user: any) => user.email === identifier);
        if (appUser) {
          // For app_users, we need to check if there's a corresponding user in the auth system
          const authUser = registeredUsers.find((u: any) => u.email === identifier);
          if (authUser) {
            foundUser = authUser;
          } else {
            // If no auth user exists, create a temporary auth object with default password
            const defaultPasswordHash = btoa("Admin@123");
            foundUser = {
              id: appUser.id,
              email: appUser.email,
              role: appUser.role,
              full_name: appUser.full_name,
              passwordHash: defaultPasswordHash
            };
          }
        }
      }
      
      // If user not found
      if (!foundUser) {
        console.log("User not found");
        toast({
          variant: "destructive",
          title: "Login failed",
          description: "Invalid email/username or password."
        });
        return false;
      }
      
      // Check password - handle both encoded and raw passwords
      const inputPasswordHash = btoa(password);
      const storedHash = foundUser.passwordHash || "";
      
      // Debug password comparison
      console.log("Comparing password hash:", { 
        input: inputPasswordHash.substring(0, 5) + "...", 
        stored: storedHash.substring(0, 5) + "..." 
      });
      
      if (inputPasswordHash !== storedHash) {
        // Try with default admin password for admin users
        if (foundUser.role === "admin" && password === "Admin@123") {
          console.log("Admin default password match");
          // Valid admin with default password
        } else {
          console.log("Password mismatch");
          toast({
            variant: "destructive",
            title: "Login failed",
            description: "Invalid email/username or password."
          });
          return false;
        }
      }
      
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
      
      // Save to localStorage and context
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
      
      navigate('/login');
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
