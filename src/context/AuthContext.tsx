
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '@/types';

interface User {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkUserRole: (requiredRoles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
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

    loadUserFromSession();
  }, []);

  const login = async (identifier: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Get users from both local storage sources
      const registeredUsers = JSON.parse(localStorage.getItem("users") || "[]");
      const appUsers = JSON.parse(localStorage.getItem("app_users") || "[]");
      
      // Check if identifier is username or email
      const isEmail = identifier.includes("@");
      
      // For debugging purposes
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
            // If no auth user exists, this means it's a system-created user (like an admin)
            // with the default password "Admin@123"
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
      
      // If user not found or password doesn't match
      if (!foundUser) {
        console.log("User not found");
        toast({
          variant: "destructive",
          title: "Login failed",
          description: "Invalid email/username or password."
        });
        return false;
      }
      
      // Check password
      const inputPasswordHash = btoa(password);
      if (inputPasswordHash !== foundUser.passwordHash) {
        console.log("Password mismatch");
        toast({
          variant: "destructive",
          title: "Login failed",
          description: "Invalid email/username or password."
        });
        return false;
      }
      
      // Create user session
      const userData = {
        id: foundUser.id,
        email: foundUser.email,
        role: foundUser.role as UserRole,
        full_name: foundUser.full_name || foundUser.fullName || "User"
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
    <AuthContext.Provider value={{ user, isLoading, login, logout, checkUserRole }}>
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
