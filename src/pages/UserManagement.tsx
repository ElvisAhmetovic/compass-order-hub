
import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import Sidebar from "@/components/dashboard/Sidebar";
import AdminGuard from "@/components/auth/AdminGuard";
import { Button } from "@/components/ui/button";
import { UserManagementTable } from "@/components/user-management/UserManagementTable";
import { AddUserModal } from "@/components/user-management/AddUserModal";
import { User } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const UserManagement = () => {
  // ALL HOOKS MUST BE CALLED FIRST - before any early returns or conditional logic
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  
  // Load users from Supabase profiles table
  const loadUsers = async () => {
    setIsLoading(true);
    try {
      console.log('Loading users from profiles table...');
      
      // Get all profiles with user data
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('updated_at', { ascending: false });

      if (profilesError) {
        console.error('Profiles error:', profilesError);
        throw profilesError;
      }

      console.log('Profiles data:', profiles);

      // Try to get auth users data, but don't fail if we can't
      let authUsers: any[] = [];
      try {
        const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
        if (!authError && authData.users) {
          authUsers = authData.users;
          console.log('Successfully fetched auth users');
        }
      } catch (error) {
        console.log('Could not fetch auth users, continuing without emails:', error);
      }

      // Convert profiles to User format
      const formattedUsers: User[] = (profiles || []).map(profile => {
        // Try to find corresponding auth user for email
        const authUser = authUsers.find((user: any) => user.id === profile.id);
        
        // Use available email sources in order of preference
        let userEmail = 'Email not available';
        if (authUser?.email) {
          userEmail = authUser.email;
        } else if (profile.id === currentUser?.id && currentUser?.email) {
          // If it's the current user, use their email from context
          userEmail = currentUser.email;
        }
        
        const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
        
        return {
          id: profile.id,
          email: userEmail,
          role: profile.role,
          full_name: fullName || 'No Name',
          created_at: authUser?.created_at || new Date().toISOString(),
          updated_at: profile.updated_at || new Date().toISOString()
        };
      });

      console.log('Formatted users:', formattedUsers);
      setUsers(formattedUsers);
    } catch (error: any) {
      console.error("Error loading users:", error);
      toast({
        variant: "destructive",
        title: "Error loading users",
        description: error.message || "Could not load the user data from database."
      });
      
      // If we can't load from database, at least show current user
      if (currentUser) {
        setUsers([{
          id: currentUser.id,
          email: currentUser.email,
          role: currentUser.role,
          full_name: currentUser.full_name || 'Current User',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);
      } else {
        setUsers([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [currentUser]);
  
  const handleAddUser = async (newUser: User) => {
    try {
      console.log('Adding new user profile:', newUser);
      
      const nameParts = newUser.full_name.split(' ');
      const { error } = await supabase
        .from('profiles')
        .insert({
          id: newUser.id,
          first_name: nameParts[0] || '',
          last_name: nameParts.slice(1).join(' ') || '',
          role: newUser.role
        });

      if (error) {
        throw error;
      }

      // Reload users to show the new one
      await loadUsers();
      
      toast({
        title: "User profile created",
        description: "New user profile has been added successfully."
      });
    } catch (error: any) {
      console.error("Error adding user:", error);
      toast({
        variant: "destructive",
        title: "Error adding user",
        description: error.message || "Could not add the new user to database."
      });
    }
  };
  
  return (
    <AdminGuard>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1">
          <Layout userRole={currentUser?.role || "admin"}>
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
                  <p className="text-muted-foreground">
                    Manage users and their permissions
                  </p>
                </div>
                <Button onClick={() => setIsAddUserModalOpen(true)}>
                  Add User Profile
                </Button>
              </div>
              
              {isLoading ? (
                <div className="flex justify-center p-8">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center p-8">
                  <p className="text-muted-foreground">No users found in the database.</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Users will appear here after they sign up or profiles are created.
                  </p>
                </div>
              ) : (
                <UserManagementTable users={users} setUsers={setUsers} onReload={loadUsers} />
              )}
              
              <AddUserModal 
                open={isAddUserModalOpen} 
                onClose={() => setIsAddUserModalOpen(false)}
                onAddUser={handleAddUser}
              />
            </div>
          </Layout>
        </div>
      </div>
    </AdminGuard>
  );
};

export default UserManagement;
