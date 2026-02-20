
import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { UserRole } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

interface AuthUser {
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
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkUserRole: (requiredRoles: UserRole[]) => boolean;
  refreshUser: () => Promise<void>;
  updateUserProfile: (profileData: Partial<AuthUser>) => Promise<boolean>;
  updatePassword: (newPassword: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const convertingRef = useRef(false);
  const { toast } = useToast();

  // Convert Supabase user to our AuthUser format
  const convertToAuthUser = async (supabaseUser: User): Promise<AuthUser> => {
    console.log('Converting user to AuthUser:', supabaseUser.email);
    
    let userRole: UserRole = 'user';
    let fullName = supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'User';
    let firstName = supabaseUser.user_metadata?.first_name || '';
    let lastName = supabaseUser.user_metadata?.last_name || '';
    
    try {
      // Fetch profile for name info
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', supabaseUser.id)
        .maybeSingle();
      
      if (profileError) {
        console.error('Error fetching profile:', profileError);
      } else if (profile) {
        if (profile.first_name || profile.last_name) {
          firstName = profile.first_name || '';
          lastName = profile.last_name || '';
          fullName = `${firstName} ${lastName}`.trim();
        }
      }

      // Fetch role from user_roles table (security best practice)
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', supabaseUser.id)
        .maybeSingle();
      
      if (roleError) {
        console.error('Error fetching user role:', roleError);
      } else if (roleData) {
        userRole = roleData.role as UserRole;
        console.log('User role from user_roles table:', userRole);
      } else {
        // If no role exists, user is a new user - create profile and assign default role
        console.log('Creating new profile and role for user');
        const nameParts = fullName.split(' ');
        
        // Create profile if it doesn't exist
        if (!profile) {
          const { error: insertProfileError } = await supabase
            .from('profiles')
            .insert({
              id: supabaseUser.id,
              first_name: nameParts[0] || '',
              last_name: nameParts.slice(1).join(' ') || '',
              role: 'user' // Keep for backwards compatibility
            });
          
          if (insertProfileError) {
            console.error('Error creating profile:', insertProfileError);
          }
        }
        
        // Note: user_roles insertion requires admin privileges
        // New users will need an admin to assign their role
        userRole = 'user';
      }
    } catch (error) {
      console.error('Error in convertToAuthUser:', error);
    }

    const authUser: AuthUser = {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      role: userRole,
      full_name: fullName,
      first_name: firstName,
      last_name: lastName,
      created_at: supabaseUser.created_at,
      last_sign_in: supabaseUser.last_sign_in_at
    };

    console.log('Final AuthUser:', authUser);
    return authUser;
  };

  useEffect(() => {
    let mounted = true;

    // Check for existing session first
    const initializeAuth = async () => {
      try {
        console.log('Initializing auth...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          if (mounted) {
            setUser(null);
            setIsLoading(false);
          }
          return;
        }

        if (mounted) {
          if (session?.user) {
            console.log('Found existing session');
            try {
              const authUser = await convertToAuthUser(session.user);
              setUser(authUser);
            } catch (error) {
              console.error('Error converting user:', error);
              setUser(null);
            }
          } else {
            console.log('No existing session');
            setUser(null);
          }
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setUser(null);
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        if (!mounted) return;
        
        if (session?.user) {
          if (convertingRef.current) return;
          convertingRef.current = true;
          (async () => {
            try {
              const authUser = await convertToAuthUser(session.user);
              if (mounted) {
                setUser(authUser);
                setIsLoading(false);
              }
            } catch (error) {
              console.error('Error converting user in auth state change:', error);
              if (mounted) {
                setUser(null);
                setIsLoading(false);
              }
            } finally {
              convertingRef.current = false;
            }
          })();
        } else {
          if (mounted) {
            setUser(null);
            setIsLoading(false);
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const refreshUser = async (): Promise<void> => {
    try {
      console.log('Refreshing user data...');
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const authUser = await convertToAuthUser(session.user);
        setUser(authUser);
        console.log('User refreshed with role:', authUser.role);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  const updateUserProfile = async (profileData: Partial<AuthUser>): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      if (!user) {
        toast({
          variant: "destructive",
          title: "Update failed",
          description: "No active session found.",
        });
        return false;
      }

      // Update profile in the profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: profileData.first_name || user.first_name,
          last_name: profileData.last_name || user.last_name,
          role: profileData.role || user.role
        })
        .eq('id', user.id);

      if (profileError) {
        throw profileError;
      }

      // Update user metadata in Supabase Auth
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: profileData.full_name || user.full_name,
          first_name: profileData.first_name || user.first_name,
          last_name: profileData.last_name || user.last_name
        }
      });

      if (authError) {
        console.warn('Could not update auth metadata:', authError);
      }

      // Refresh user data
      await refreshUser();
      
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
      
      if (!user) {
        return false;
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        throw error;
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

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log(`Login attempt for: ${email}`);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.log("Login error:", error.message);
        toast({
          variant: "destructive",
          title: "Login failed",
          description: error.message
        });
        return false;
      }

      if (data.user) {
        console.log("Login successful for:", data.user.email);
        
        toast({
          title: "Login successful",
          description: `Welcome back!`,
        });
        
        return true;
      }

      return false;
    } catch (error) {
      console.error("Login error:", error);
      toast({
        variant: "destructive",
        title: "Login failed",
        description: "An unexpected error occurred. Please try again later.",
      });
      return false;
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
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
